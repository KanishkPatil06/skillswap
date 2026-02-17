"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, Github, Award, Plus, Trash2, ExternalLink, Link as LinkIcon, Edit2, Loader2, Image as ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PortfolioItem {
    id: string
    title: string
    description: string | null
    item_url: string | null
    image_url: string | null
    item_type: 'project' | 'github' | 'certification' | 'other'
    created_at: string
}

interface PortfolioSectionProps {
    userId: string
    isOwnProfile: boolean
}

export function PortfolioSection({ userId, isOwnProfile }: PortfolioSectionProps) {
    const [items, setItems] = useState<PortfolioItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
    const supabase = createClient()
    const { toast } = useToast()

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        item_url: "",
        image_url: "",
        item_type: "project" as 'project' | 'github' | 'certification' | 'other'
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchItems()
    }, [userId])

    const fetchItems = async () => {
        const { data, error } = await supabase
            .from('user_portfolio_items')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setItems(data)
        }
        setLoading(false)
    }

    const handleOpenDialog = (item?: PortfolioItem) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                title: item.title,
                description: item.description || "",
                item_url: item.item_url || "",
                image_url: item.image_url || "",
                item_type: item.item_type
            })
        } else {
            setEditingItem(null)
            setFormData({
                title: "",
                description: "",
                item_url: "",
                image_url: "",
                item_type: "project"
            })
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast({ title: "Title required", variant: "destructive" })
            return
        }

        setSaving(true)
        try {
            if (editingItem) {
                const { error } = await supabase
                    .from('user_portfolio_items')
                    .update({
                        title: formData.title,
                        description: formData.description || null,
                        item_url: formData.item_url || null,
                        image_url: formData.image_url || null,
                        item_type: formData.item_type,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingItem.id)

                if (error) throw error
                setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...formData } : i))
                toast({ title: "Updated", description: "Portfolio item updated." })
            } else {
                const { data, error } = await supabase
                    .from('user_portfolio_items')
                    .insert({
                        user_id: userId,
                        title: formData.title,
                        description: formData.description || null,
                        item_url: formData.item_url || null,
                        image_url: formData.image_url || null,
                        item_type: formData.item_type
                    })
                    .select()
                    .single()

                if (error) throw error
                if (data) setItems(prev => [data, ...prev])
                toast({ title: "Added", description: "Portfolio item added." })
            }
            setIsDialogOpen(false)
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        try {
            const { error } = await supabase.from('user_portfolio_items').delete().eq('id', id)
            if (error) throw error
            setItems(prev => prev.filter(i => i.id !== id))
            toast({ title: "Deleted", description: "Item removed." })
        } catch (error) {
            toast({ title: "Error", variant: "destructive" })
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'github': return <Github className="w-4 h-4" />
            case 'certification': return <Award className="w-4 h-4" />
            default: return <Briefcase className="w-4 h-4" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'github': return 'GitHub'
            case 'certification': return 'Certificate'
            case 'project': return 'Project'
            default: return 'Other'
        }
    }

    if (loading) return <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>

    if (items.length === 0 && !isOwnProfile) {
        return (
            <div className="text-center py-8 rounded-lg border border-dashed bg-muted/30">
                <Briefcase className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm">No portfolio items added yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Portfolio & Projects
                </h3>
                {isOwnProfile && (
                    <Button size="sm" onClick={() => handleOpenDialog()}>
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg bg-muted/30">
                    <p className="text-muted-foreground text-sm">Showcase your work, GitHub repos, or certificates.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(item => (
                        <Card key={item.id} className="group overflow-hidden hover:shadow-md transition-all">
                            {(item.image_url) && (
                                <div className="h-32 w-full bg-muted relative overflow-hidden">
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                </div>
                            )}
                            <CardContent className={cn("p-4", !item.image_url && "pt-4")}>
                                <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-1">
                                                {getTypeIcon(item.item_type)}
                                                {getTypeLabel(item.item_type)}
                                            </Badge>
                                            <h4 className="font-semibold truncate text-sm" title={item.title}>{item.title}</h4>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">{item.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {item.item_url && (
                                            <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                                <a href={item.item_url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </Button>
                                        )}
                                        {isOwnProfile && (
                                            <>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenDialog(item)}>
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Item' : 'Add to Portfolio'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={formData.item_type} onValueChange={(val: any) => setFormData(prev => ({ ...prev, item_type: val }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="project">Project</SelectItem>
                                    <SelectItem value="github">GitHub Repo</SelectItem>
                                    <SelectItem value="certification">Certification</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Project Name or Certificate Title" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Link URL (Optional)</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input className="pl-9" value={formData.item_url} onChange={e => setFormData(prev => ({ ...prev, item_url: e.target.value }))} placeholder="https://..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Image URL (Optional)</Label>
                            <div className="relative">
                                <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input className="pl-9" value={formData.image_url} onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))} placeholder="https://..." />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Item'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
