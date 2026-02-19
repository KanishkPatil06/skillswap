import { format } from "date-fns"
import { Calendar, Clock, Video } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface SessionCardProps {
    session: any
    userId: string
}

export function SessionCard({ session, userId }: SessionCardProps) {
    const isMentor = session.mentor_id === userId
    const otherPerson = isMentor ? session.learner : session.mentor
    const role = isMentor ? "Mentor" : "Learner"
    const scheduledDate = new Date(session.scheduled_at)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={otherPerson.avatar_url} alt={otherPerson.full_name} />
                    <AvatarFallback>{otherPerson.full_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-base">{otherPerson.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {isMentor ? `Teaching: ${session.skill.name}` : `Learning: ${session.skill.name}`}
                    </p>
                </div>
                <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                    {session.status}
                </Badge>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(scheduledDate, "PPP")}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                        {format(scheduledDate, "p")} - {format(new Date(scheduledDate.getTime() + session.duration_minutes * 60000), "p")}
                    </span>
                </div>
                {session.notes && (
                    <div className="mt-2 text-muted-foreground italic">
                        &quot;{session.notes}&quot;
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                {session.status === 'scheduled' && session.meeting_link && (
                    <Button variant="default" size="sm" asChild>
                        <Link href={session.meeting_link} target="_blank">
                            <Video className="mr-2 h-4 w-4" />
                            Join Meeting
                        </Link>
                    </Button>
                )}
                {session.status === 'scheduled' && !session.meeting_link && (
                    <Button variant="outline" size="sm" disabled>
                        <Video className="mr-2 h-4 w-4" />
                        No Link Yet
                    </Button>
                )}
                <Button variant="ghost" size="sm">
                    Details
                </Button>
            </CardFooter>
        </Card>
    )
}
