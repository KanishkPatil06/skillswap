"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AvatarUploadProps {
    userId: string
    currentAvatarUrl?: string | null
    onUploadComplete?: (url: string) => void
}

export function AvatarUpload({ userId, currentAvatarUrl, onUploadComplete }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()
    const { toast } = useToast()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid File",
                description: "Please select an image file",
                variant: "destructive"
            })
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "Please select an image under 5MB",
                variant: "destructive"
            })
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Upload file
        uploadAvatar(file)
    }

    const uploadAvatar = async (file: File) => {
        setUploading(true)

        try {
            // Resize image using canvas
            const resizedBlob = await resizeImage(file, 512, 512)

            // Create file path
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}/avatar.${fileExt}`

            // Delete old avatar if exists
            if (avatarUrl) {
                const oldPath = avatarUrl.split('/').slice(-2).join('/')
                await supabase.storage.from('avatars').remove([oldPath])
            }

            // Upload new avatar
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, resizedBlob, {
                    upsert: true,
                    contentType: file.type
                })

            if (error) throw error

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId)

            if (updateError) throw updateError

            setAvatarUrl(publicUrl)
            setPreview(null)
            onUploadComplete?.(publicUrl)

            toast({
                title: "Success!",
                description: "Profile picture updated successfully"
            })
        } catch (error) {
            console.error('Upload error:', error)
            toast({
                title: "Upload Failed",
                description: "Failed to upload profile picture",
                variant: "destructive"
            })
            setPreview(null)
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width
                        width = maxWidth
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height
                        height = maxHeight
                    }
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed to create blob'))
                    }
                }, file.type)
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(file)
        })
    }

    const handleRemoveAvatar = async () => {
        try {
            setUploading(true)

            // Delete from storage
            if (avatarUrl) {
                const oldPath = avatarUrl.split('/').slice(-2).join('/')
                await supabase.storage.from('avatars').remove([oldPath])
            }

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', userId)

            if (error) throw error

            setAvatarUrl(null)
            toast({
                title: "Removed",
                description: "Profile picture removed"
            })
        } catch (error) {
            console.error('Remove error:', error)
            toast({
                title: "Failed",
                description: "Failed to remove profile picture",
                variant: "destructive"
            })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <Label className="text-sm font-medium">Profile Picture</Label>

            <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                    <AvatarImage src={preview || avatarUrl || undefined} alt="Avatar" />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-white">
                        {userId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    <Camera className="w-5 h-5" />
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <Camera className="w-4 h-4 mr-2" />
                    {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>

                {avatarUrl && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={uploading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                    </Button>
                )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
                Recommended: Square image, max 5MB
            </p>
        </div>
    )
}
