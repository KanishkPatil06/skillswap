"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Clock, Plus, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function AvailabilitySettings({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [availabilities, setAvailabilities] = useState<any[]>([])
    const supabase = createClient()
    const { toast } = useToast()

    const DAYS = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ]

    const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2)
        const minute = i % 2 === 0 ? "00" : "30"
        return `${hour.toString().padStart(2, "0")}:${minute}`
    })

    useEffect(() => {
        fetchAvailability()
    }, [userId])

    const fetchAvailability = async () => {
        try {
            const { data, error } = await supabase
                .from("user_availability")
                .select("*")
                .eq("user_id", userId)
                .order("day_of_week")
                .order("start_time")

            if (error) throw error
            setAvailabilities(data || [])
        } catch (error) {
            console.error("Error fetching availability:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddSlot = () => {
        setAvailabilities([
            ...availabilities,
            {
                id: `temp-${Date.now()}`,
                day_of_week: 1, // Monday
                start_time: "09:00",
                end_time: "17:00",
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                isNew: true
            }
        ])
    }

    const handleRemoveSlot = async (id: string, isNew?: boolean) => {
        if (isNew) {
            setAvailabilities(availabilities.filter(a => a.id !== id))
            return
        }

        try {
            const { error } = await supabase
                .from("user_availability")
                .delete()
                .eq("id", id)

            if (error) throw error
            setAvailabilities(availabilities.filter(a => a.id !== id))
        } catch (error) {
            toast({
                title: "Error removing slot",
                description: "Could not remove availability slot.",
                variant: "destructive",
            })
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Upsert all slots
            const upsertData = availabilities.map(slot => ({
                user_id: userId,
                day_of_week: slot.day_of_week,
                start_time: slot.start_time,
                end_time: slot.end_time,
                timezone: slot.timezone,
                ...(slot.isNew ? {} : { id: slot.id })
            }))

            // Remove temp IDs from new slots for insertion
            const cleanData = upsertData.map(slot => {
                if (typeof slot.id === 'string' && slot.id.startsWith('temp-')) {
                    const { id, ...rest } = slot
                    return rest
                }
                return slot
            })

            const { error } = await supabase
                .from("user_availability")
                .upsert(cleanData)

            if (error) throw error

            toast({
                title: "Availability saved",
                description: "Your schedule has been updated.",
            })
            fetchAvailability() // Refresh to get real IDs
        } catch (error) {
            console.error("Save error:", error)
            toast({
                title: "Error saving",
                description: "Could not save your availability.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const updateSlot = (id: string, field: string, value: any) => {
        setAvailabilities(availabilities.map(slot =>
            slot.id === id ? { ...slot, [field]: value } : slot
        ))
    }

    if (loading) return <div className="p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Weekly Availability
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Set the times you are available for skill swap sessions.
                    </p>
                </div>
                <Button onClick={handleAddSlot} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slot
                </Button>
            </div>

            <div className="space-y-3">
                {availabilities.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground">
                        No availability slots added yet.
                    </div>
                ) : (
                    availabilities.map((slot) => (
                        <div key={slot.id} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                            <Select
                                value={slot.day_of_week.toString()}
                                onValueChange={(val) => updateSlot(slot.id, "day_of_week", parseInt(val))}
                            >
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS.map((day, i) => (
                                        <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2 flex-1 w-full text-sm">
                                <Select
                                    value={slot.start_time.slice(0, 5)}
                                    onValueChange={(val) => updateSlot(slot.id, "start_time", val)}
                                >
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="h-48">
                                        {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <span>to</span>
                                <Select
                                    value={slot.end_time.slice(0, 5)}
                                    onValueChange={(val) => updateSlot(slot.id, "end_time", val)}
                                >
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="h-48">
                                        {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => handleRemoveSlot(slot.id, slot.isNew)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {availabilities.length > 0 && (
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving} className="gradient-primary">
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
    )
}
