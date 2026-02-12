import { AvailabilityForm } from "@/components/availability/availability-form"

export default function AvailabilityPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Availability</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your weekly schedule for mentorship sessions.
                </p>
            </div>
            <AvailabilityForm />
        </div>
    )
}
