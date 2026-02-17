"use client"

import { useState } from "react"
import { CalendarIcon, Loader2, Clock } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BookSessionDialogProps {
    mentorId: string
    mentorName: string
    skillId: string
    skillName: string
    children?: React.ReactNode
}

export function BookSessionDialog({
    mentorId,
    mentorName,
    skillId,
    skillName,
    children,
}: BookSessionDialogProps) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date>()
    const [timeSlot, setTimeSlot] = useState<string | null>(null)
    const [duration, setDuration] = useState(60)
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)
    const [availability, setAvailability] = useState<any[]>([])
    const [fetchingAvailability, setFetchingAvailability] = useState(false)

    // Fetch availability when dialog opens
    const onOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (newOpen && availability.length === 0) {
            fetchAvailability()
        }
    }

    const fetchAvailability = async () => {
        try {
            setFetchingAvailability(true)
            // We need a public endpoint or query to get another user's availability
            // Since our API currently gets "my" availability, we need to adjustments.
            // For now, let's assume we can fetch it via a query param or a distinct endpoint.
            // I'll assume we can use a server action or just pass it in, but strictly 
            // strictly speaking we need an API.
            // Let's mock it for now or assume a `GET /api/users/[id]/availability` exists.
            // Actually, I didn't create that endpoint.
            // I will implement a quick fetch logic here adjusting the previous route or just use a mock 
            // until I update the backend. 
            // Wait, let's create a Server Action or just fetch from a new endpoint.
            // I will assume for this step that I'll fix the API later. 
            // Actually fail fast: I need to allow fetching OTHER user's availability.
            // I'll do a quick client-side fetch to supabase directly if RLS allows, 
            // or use a specific API route. 
            // RLS says "Availabilities are publicly readable". So I can use Supabase client directly!

            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data, error } = await supabase
                .from('availabilities')
                .select('*')
                .eq('user_id', mentorId)

            if (error) throw error
            setAvailability(data || [])
        } catch (error) {
            console.error("Error fetching availability:", error)
            toast.error("Could not load mentor availability")
        } finally {
            setFetchingAvailability(false)
        }
    }

    // Generate time slots based on selected date and availability
    const generateTimeSlots = () => {
        if (!date || availability.length === 0) return []

        const dayOfWeek = date.getDay()
        const config = availability.find(a => a.day_of_week === dayOfWeek)

        if (!config) return []

        const slots = []
        const startHour = parseInt(config.start_time.split(':')[0])
        const endHour = parseInt(config.end_time.split(':')[0])

        for (let hour = startHour; hour < endHour; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`)
            slots.push(`${hour.toString().padStart(2, '0')}:30`)
        }

        return slots
    }

    const slots = generateTimeSlots()

    const handleBook = async () => {
        if (!date || !timeSlot) return

        try {
            setLoading(true)

            // Construct scheduled_at timestamp
            const [hours, minutes] = timeSlot.split(':')
            const scheduledAt = new Date(date)
            scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0)

            const response = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mentor_id: mentorId,
                    skill_id: skillId,
                    scheduled_at: scheduledAt.toISOString(),
                    duration_minutes: duration,
                    notes
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to book session")
            }

            toast.success("Session booked successfully!")
            setOpen(false)
            setDate(undefined)
            setTimeSlot(null)
            setNotes("")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children || <Button>Book Session</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
                {/* Gradient Accent Strip */}
                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, hsl(250,95%,63%), hsl(168,76%,42%), hsl(280,95%,68%))' }} />
                <div className="px-6 pt-5">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            Book a Session
                        </DialogTitle>
                        <DialogDescription>
                            Schedule a session with <span className="font-medium text-[hsl(var(--foreground))]">{mentorName}</span> for <span className="font-medium text-primary">{skillName}</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="grid gap-5 px-6 py-4">
                    {/* Duration Selector */}
                    <div className="grid gap-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Duration</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {[30, 60, 90].map((d) => (
                                <Button
                                    key={d}
                                    variant={duration === d ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setDuration(d)}
                                    className={cn(
                                        "w-full transition-all",
                                        duration === d && "shadow-md"
                                    )}
                                >
                                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                                    {d} min
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="grid gap-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Select Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal h-11",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => {
                                        setDate(d)
                                        setTimeSlot(null)
                                    }}
                                    disabled={(date) =>
                                        date < new Date() ||
                                        (availability.length > 0 && !availability.some(a => a.day_of_week === date.getDay()))
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Time Slots */}
                    {date && (
                        <div className="grid gap-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Select Time</Label>
                            <ScrollArea className="h-40 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
                                {fetchingAvailability ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    slots.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {slots.map((slot) => (
                                                <Button
                                                    key={slot}
                                                    variant={timeSlot === slot ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setTimeSlot(slot)}
                                                    className={cn(
                                                        "w-full text-xs transition-all",
                                                        timeSlot === slot && "shadow-md ring-2 ring-primary/20"
                                                    )}
                                                >
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {slot}
                                                </Button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-[hsl(var(--muted-foreground))] text-sm gap-1">
                                            <Clock className="w-5 h-5 opacity-40" />
                                            {availability.length === 0 ? (
                                                <div className="text-center px-4">
                                                    <p>Mentor has not set any availability.</p>
                                                    <p className="text-xs opacity-70 mt-1">Try messaging them to request a slot.</p>
                                                </div>
                                            ) : (
                                                "No available slots for this date"
                                            )}
                                        </div>
                                    )
                                )}
                            </ScrollArea>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="grid gap-2">
                        <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="What do you want to focus on?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[80px] bg-[hsl(var(--card))] border-[hsl(var(--border))]"
                        />
                    </div>
                </div>
                <div className="px-6 pb-6">
                    <Button
                        onClick={handleBook}
                        disabled={!date || !timeSlot || loading}
                        className={cn(
                            "w-full h-11 text-sm font-semibold shadow-lg",
                            !date || !timeSlot ? "opacity-70 cursor-not-allowed" : ""
                        )}
                        size="lg"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {!date ? "Pick a date to continue" :
                            !timeSlot ? "Select a time slot" :
                                `Confirm Booking — ${duration} min session`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
