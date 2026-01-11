"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import { useEffect } from "react"

export default function CreateHelpRequestDialog({
  onRequestCreated,
  userId,
}: {
  onRequestCreated: () => void
  userId: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<any[]>([])
  const [formData, setFormData] = useState({ title: "", description: "", skill_id: "" })
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchSkills = async () => {
      const { data } = await supabase.from("skills").select("*")
      setSkills(data || [])
    }
    fetchSkills()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.skill_id) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("help_requests").insert({
        user_id: userId,
        skill_id: formData.skill_id,
        title: formData.title,
        description: formData.description,
        status: "open",
      })

      if (error) throw error
      toast({ title: "Success", description: "Help request created!" })
      setFormData({ title: "", description: "", skill_id: "" })
      setOpen(false)
      onRequestCreated()
    } catch (error) {
      toast({ title: "Error", description: "Failed to create request", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-5 h-5" />
          Create Request
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-gray-900 border border-border">
        <DialogHeader>
          <DialogTitle>Create Help Request</DialogTitle>
          <DialogDescription>Ask the community for help with a specific skill</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Skill *</label>
            <Select value={formData.skill_id} onValueChange={(val) => setFormData({ ...formData, skill_id: val })}>
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900">
                {skills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What help do you need?"
              className="bg-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide more details about what you need help with..."
              rows={4}
              className="bg-input"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
