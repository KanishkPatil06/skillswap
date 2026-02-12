"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"

const DAYS = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

const TIMEZONES = [
    "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Kolkata", "Australia/Sydney"
]

interface Availability {
    id?: string
    day_of_week: number
    start_time: string
    end_time: string
    is_enabled: boolean
}

export function AvailabilitySettings({ userId }: { userId: string }) {
    const [availability, setAvailability] = useState<Availability[]>([])
    const [timezone, setTimezone] = useState("UTC")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [userId])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const supabase = createClient()

            // Fetch profile for timezone
            const { data: profile } = await supabase
                .from('profiles')
                .select('timezone')
                .eq('id', userId)
                .single()

            if (profile?.timezone) {
                setTimezone(profile.timezone)
            }

            // Fetch availability
            const { data: avail } = await supabase
                .from('availabilities')
                .select('*')
                .eq('user_id', userId)

            // Initialize with all days if empty
            if (!avail || avail.length === 0) {
                const initial = DAYS.map((_, index) => ({
                    day_of_week: index,
                    start_time: "09:00",
                    end_time: "17:00",
                    is_enabled: false // Default disabled
                }))
                setAvailability(initial)
            } else {
                // Merge active configs with defaults for missing days
                const merged = DAYS.map((_, index) => {
                    const existing = avail.find(a => a.day_of_week === index)
                    return existing || {
                        day_of_week: index,
                        start_time: "09:00",
                        end_time: "17:00",
                        is_enabled: false
                    }
                })
                setAvailability(merged)
            }
        } catch (error) {
            console.error("Error fetching settings:", error)
            toast.error("Failed to load settings")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const supabase = createClient()

            // 1. Update Timezone
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ timezone })
                .eq('id', userId)

            if (profileError) throw profileError

            // 2. Upsert Availability
            // We only save enabled days or update disabled status if existing
            // Actually, simplest is to upsert all rows.
            const upsertData = availability.map(a => ({
                user_id: userId,
                day_of_week: a.day_of_week,
                start_time: a.start_time,
                end_time: a.end_time,
                // If it has an ID, keep it, otherwise upsert on (user_id, day_of_week) conflict
            }))

            // Note: Postgres upsert needs conflict constraint.
            // Our schema should have a unique constraint on (user_id, day_of_week).
            // If not, we might get duplicates. I should assume there is one or handle deletes first.
            // Let's assume there's a constraint or do a delete-insert strategy which is safer if unsure.
            // Delete existing then insert is cleaner for "set state".

            const { error: deleteError } = await supabase
                .from('availabilities')
                .delete()
                .eq('user_id', userId)

            if (deleteError) throw deleteError

            // Filter out disabled ones if we want to save space?
            // Or save strictly what is configured. Saving only enabled ones means default is "unavailable".
            const activeData = availability.filter(a => a.is_enabled).map(a => ({
                user_id: userId,
                day_of_week: a.day_of_week,
                start_time: a.start_time,
                end_time: a.end_time
            }))

            if (activeData.length > 0) {
                const { error: insertError } = await supabase
                    .from('availabilities')
                    .insert(activeData)

                if (insertError) throw insertError
            }

            toast.success("Availability settings saved")
        } catch (error) {
            console.error("Error saving settings:", error)
            toast.error("Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Time Zone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIMEZONES.map(tz => (
                                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        All times will be adjusted to your local time.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-base">Weekly Schedule</Label>
                <div className="grid gap-4">
                    {availability.map((day, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg bg-card/50">
                            <Switch
                                checked={day.is_enabled}
                                onCheckedChange={(checked) => {
                                    const newAvail = [...availability]
                                    newAvail[index].is_enabled = checked
                                    setAvailability(newAvail)
                                }}
                            />
                            <div className="w-24 font-medium">{DAYS[day.day_of_week]}</div>

                            {day.is_enabled ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <Input
                                        type="time"
                                        value={day.start_time.slice(0, 5)} // HH:MM
                                        onChange={(e) => {
                                            const newAvail = [...availability]
                                            newAvail[index].start_time = e.target.value
                                            setAvailability(newAvail)
                                        }}
                                        className="w-32"
                                    />
                                    <span>to</span>
                                    <Input
                                        type="time"
                                        value={day.end_time.slice(0, 5)}
                                        onChange={(e) => {
                                            const newAvail = [...availability]
                                            newAvail[index].end_time = e.target.value
                                            setAvailability(newAvail)
                                        }}
                                        className="w-32"
                                    />
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-sm italic">Unavailable</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    )
}
