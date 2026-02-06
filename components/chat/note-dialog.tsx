"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StickyNote } from "lucide-react"

interface NoteDialogProps {
    onSave: (title: string, content: string) => Promise<void>
    disabled?: boolean
}

export function NoteDialog({ onSave, disabled }: NoteDialogProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return

        setSaving(true)
        try {
            await onSave(title.trim(), content.trim())
            setTitle("")
            setContent("")
            setOpen(false)
        } catch (error) {
            console.error("Failed to save note:", error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className="shrink-0"
                >
                    <StickyNote className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle>Create Note</DialogTitle>
                    <DialogDescription>
                        Create a note to share in this conversation
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="note-title">Title</Label>
                        <Input
                            id="note-title"
                            placeholder="Enter note title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={saving}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="note-content">Content</Label>
                        <Textarea
                            id="note-content"
                            placeholder="Enter note content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={saving}
                            rows={8}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!title.trim() || !content.trim() || saving}
                    >
                        {saving ? "Saving..." : "Save Note"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
