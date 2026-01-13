"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { X, Loader2 } from "lucide-react"

interface UserSkill {
  id: string
  skill_id: string
  level: string
  skill?: { name: string }
}

export default function SkillsTab({ user }: { user: User }) {
  const [skills, setSkills] = useState<any[]>([])
  const [userSkills, setUserSkills] = useState<UserSkill[]>([])
  const [selectedSkill, setSelectedSkill] = useState("")
  const [loading, setLoading] = useState(false)
  const [removingSkillId, setRemovingSkillId] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      const { data: skillsData } = await supabase.from("skills").select("*")
      setSkills(skillsData || [])

      const { data: userSkillsData } = await supabase
        .from("user_skills")
        .select("*, skill:skills(name)")
        .eq("user_id", user.id)
      setUserSkills(userSkillsData || [])
    }
    fetchData()
  }, [user.id, supabase])

  const handleAddSkill = async () => {
    if (!selectedSkill) return
    setLoading(true)

    try {
      const { error } = await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_id: selectedSkill,
        level: "Beginner",
      })

      if (error) throw error
      toast({ title: "Success", description: "Skill added successfully" })

      const { data } = await supabase.from("user_skills").select("*, skill:skills(name)").eq("user_id", user.id)
      setUserSkills(data || [])
      setSelectedSkill("")
    } catch (error) {
      toast({ title: "Error", description: "Failed to add skill", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSkill = async (skillId: string) => {
    setRemovingSkillId(skillId)
    try {
      const { error } = await supabase.from("user_skills").delete().eq("id", skillId)
      if (error) throw error
      setUserSkills(userSkills.filter((s) => s.id !== skillId))
      toast({ title: "Success", description: "Skill removed" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove skill", variant: "destructive" })
    } finally {
      setRemovingSkillId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Skills</CardTitle>
        <CardDescription>Add and manage your technical and non-technical skills</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 max-w-md">
          <div className="flex gap-2">
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger>
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent>
                {skills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddSkill} disabled={!selectedSkill || loading}>
              Add Skill
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userSkills.map((userSkill) => (
            <Card key={userSkill.id} className="bg-muted/30">
              <CardContent className="pt-4 flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{userSkill.skill?.name}</h4>
                  <p className="text-sm text-muted-foreground">Level: {userSkill.level}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSkill(userSkill.id)}
                  disabled={removingSkillId === userSkill.id}
                >
                  {removingSkillId === userSkill.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {userSkills.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No skills added yet. Add your first skill above!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
