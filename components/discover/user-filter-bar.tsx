"use client"

import { Search, SlidersHorizontal, MapPin, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

interface UserFilterBarProps {
    onSearchChange: (value: string) => void
    onSkillChange: (value: string) => void
    onLevelChange: (value: string) => void
    onCategoryChange?: (value: string) => void
    onAvailabilityChange?: (value: string) => void
    onLocationChange?: (value: string) => void
    skills: any[]
}

export function UserFilterBar({
    onSearchChange,
    onSkillChange,
    onLevelChange,
    onCategoryChange,
    onAvailabilityChange,
    onLocationChange,
    skills,
}: UserFilterBarProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeFilters, setActiveFilters] = useState<string[]>([])

    // Local state for filters to show visual feedback
    const [selectedSkill, setSelectedSkill] = useState("all")
    const [selectedLevel, setSelectedLevel] = useState("all")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [locationTerm, setLocationTerm] = useState("")

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)
        onSearchChange(value)
    }

    const handleClearFilters = () => {
        setSearchTerm("")
        setSelectedSkill("all")
        setSelectedLevel("all")
        setSelectedCategory("all")
        setLocationTerm("")

        onSearchChange("")
        onSkillChange("all")
        onLevelChange("all")
        if (onCategoryChange) onCategoryChange("all")
        if (onLocationChange) onLocationChange("")

        setActiveFilters([])
    }

    const uniqueCategories = Array.from(new Set(skills.map(s => s.category).filter(Boolean)))

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
                {/* Main Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, bio, or role..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-9 bg-card"
                    />
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    <Select
                        value={selectedSkill}
                        onValueChange={(val) => {
                            setSelectedSkill(val)
                            onSkillChange(val)
                        }}
                    >
                        <SelectTrigger className="w-[140px] bg-card">
                            <SelectValue placeholder="Skill" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Skills</SelectItem>
                            {skills.map((skill) => (
                                <SelectItem key={skill.id} value={skill.id}>
                                    {skill.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedLevel}
                        onValueChange={(val) => {
                            setSelectedLevel(val)
                            onLevelChange(val)
                        }}
                    >
                        <SelectTrigger className="w-[130px] bg-card">
                            <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Advanced Filters Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="bg-card gap-2">
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters
                                {(selectedCategory !== "all" || locationTerm) && (
                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                        {(selectedCategory !== "all" ? 1 : 0) + (locationTerm ? 1 : 0)}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 bg-popover" align="end">
                            <div className="space-y-4">
                                <h4 className="font-medium leading-none mb-2">Advanced Filters</h4>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={selectedCategory}
                                        onValueChange={(val) => {
                                            setSelectedCategory(val)
                                            if (onCategoryChange) onCategoryChange(val)
                                        }}
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover">
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {uniqueCategories.map((cat: any) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                        <Input
                                            id="location"
                                            placeholder="City or Country..."
                                            value={locationTerm}
                                            onChange={(e) => {
                                                setLocationTerm(e.target.value)
                                                if (onLocationChange) onLocationChange(e.target.value)
                                            }}
                                            className="pl-8 h-9"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-between">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearFilters}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        Reset
                                    </Button>
                                    <Button size="sm" onClick={() => document.body.click()}>
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Active Filter Badges */}
            {(selectedSkill !== "all" || selectedLevel !== "all" || selectedCategory !== "all" || locationTerm) && (
                <div className="flex flex-wrap gap-2">
                    {selectedSkill !== "all" && (
                        <Badge variant="secondary" className="gap-1 pl-2">
                            Skill: {skills.find(s => s.id === selectedSkill)?.name}
                            <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => {
                                setSelectedSkill("all")
                                onSkillChange("all")
                            }} />
                        </Badge>
                    )}
                    {selectedLevel !== "all" && (
                        <Badge variant="secondary" className="gap-1 pl-2">
                            Level: {selectedLevel}
                            <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => {
                                setSelectedLevel("all")
                                onLevelChange("all")
                            }} />
                        </Badge>
                    )}
                    {selectedCategory !== "all" && (
                        <Badge variant="secondary" className="gap-1 pl-2">
                            Category: {selectedCategory}
                            <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => {
                                setSelectedCategory("all")
                                if (onCategoryChange) onCategoryChange("all")
                            }} />
                        </Badge>
                    )}
                    {locationTerm && (
                        <Badge variant="secondary" className="gap-1 pl-2">
                            Location: {locationTerm}
                            <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => {
                                setLocationTerm("")
                                if (onLocationChange) onLocationChange("")
                            }} />
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-muted-foreground" onClick={handleClearFilters}>
                        Clear All
                    </Button>
                </div>
            )}
        </div>
    )
}
