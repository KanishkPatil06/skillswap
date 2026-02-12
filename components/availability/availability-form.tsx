"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const DAYS_OF_WEEK = [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
]

const availabilitySchema = z.object({
    availabilities: z.array(
        z.object({
            day_of_week: z.string(),
            start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
            end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
        })
    ).refine(
        (items) => items.every((item) => item.start_time < item.end_time),
        { message: "End time must be after start time", path: ["availabilities"] }
    ),
})

type AvailabilityFormValues = z.infer<typeof availabilitySchema>

export function AvailabilityForm() {
    const [loading, setLoading] = useState(true)

    const form = useForm<AvailabilityFormValues>({
        resolver: zodResolver(availabilitySchema),
        defaultValues: {
            availabilities: [],
        },
    })

    const { fields, append, remove } = useFieldArray({
        name: "availabilities",
        control: form.control,
    })

    useEffect(() => {
        async function fetchAvailability() {
            try {
                const response = await fetch("/api/availability")
                if (response.ok) {
                    const data = await response.json()
                    // Format data for form
                    const formattedData = data.map((item: any) => ({
                        day_of_week: item.day_of_week.toString(),
                        start_time: item.start_time.slice(0, 5), // HH:MM
                        end_time: item.end_time.slice(0, 5), // HH:MM
                    }))
                    form.reset({ availabilities: formattedData })
                }
            } catch (error) {
                toast.error("Failed to load availability")
            } finally {
                setLoading(false)
            }
        }

        fetchAvailability()
    }, [form])

    async function onSubmit(data: AvailabilityFormValues) {
        try {
            setLoading(true)
            const response = await fetch("/api/availability", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    availabilities: data.availabilities.map(item => ({
                        ...item,
                        day_of_week: parseInt(item.day_of_week),
                    })),
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to save availability")
            }

            toast.success("Availability updated successfully")
        } catch (error) {
            toast.error("An error occurred while saving availability")
        } finally {
            setLoading(false)
        }
    }

    if (loading && fields.length === 0) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
                <CardDescription>
                    Set your recurring weekly availability for mentorship sessions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`availabilities.${index}.day_of_week`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Day</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select day" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {DAYS_OF_WEEK.map((day) => (
                                                            <SelectItem key={day.value} value={day.value}>
                                                                {day.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`availabilities.${index}.start_time`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Start Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`availabilities.${index}.end_time`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>End Time</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="mb-0.5"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => append({ day_of_week: "1", start_time: "09:00", end_time: "17:00" })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Time Slot
                        </Button>

                        <Separator />

                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
