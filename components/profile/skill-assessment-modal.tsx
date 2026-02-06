"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle, Award, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Question {
    id: number
    text: string
    options: string[]
    correctIndex?: number // Only used for debugging or client-side verification if simple
}

interface SkillAssessmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    skillId: string
    skillName: string
    level: string
    onVerified: () => void
}

export function SkillAssessmentModal({
    open,
    onOpenChange,
    skillId,
    skillName,
    level,
    onVerified
}: SkillAssessmentModalProps) {
    const [step, setStep] = useState<"intro" | "loading" | "quiz" | "submitting" | "result">("intro")
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<number[]>([]) // Store indices of selected answers
    const [score, setScore] = useState(0)
    const [passed, setPassed] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { toast } = useToast()
    const router = useRouter()

    const startAssessment = async () => {
        setStep("loading")
        setError(null)

        try {
            const response = await fetch("/api/assessment/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skillName, level })
            })

            const data = await response.json()

            if (data.error) throw new Error(data.error)
            if (!data.questions || data.questions.length === 0) throw new Error("No questions generated")

            setQuestions(data.questions)
            setAnswers(new Array(data.questions.length).fill(-1))
            setStep("quiz")
            setCurrentQuestionIndex(0)
        } catch (err) {
            console.error("Assessment start error:", err)
            setError("Failed to generate assessment. Please try again.")
            setStep("intro")
        }
    }

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = optionIndex
        setAnswers(newAnswers)
    }

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            submitAssessment()
        }
    }

    const submitAssessment = async () => {
        setStep("submitting")

        // Calculate local score for display (if we trust client) 
        // BUT we should verify on server. 
        // For this implementation, we'll send answers to server for verification.
        // The server needs to know the questions too since they were dynamically generated and maybe not stored?
        // Wait, the 'generate' API returned questions. Ideally 'generate' should store them temporarily or sign them.
        // Simpler approach for prototype: 'generative' API returns correctIndex, client calculates score, server trusts client (NOT SECURE).
        // Better secure approach: Client sends questions + answers back to server, server verifies (since AI generated them, server can't recall them easily without DB).
        // We will send questions + answers to server. Server will verify against the 'correctIndex' embedded in the questions object (which user could theoretically see in network tab, but ok for now).

        // Calculate score locally for UI speed, but verify on server
        let calculatedScore = 0
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correctIndex) calculatedScore++
        })

        try {
            const response = await fetch("/api/assessment/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userSkillId: skillId,
                    score: calculatedScore,
                    maxScore: questions.length,
                    questions,
                    userAnswers: answers
                })
            })

            const data = await response.json()

            if (data.error) throw new Error(data.error)

            setScore(calculatedScore)
            setPassed(data.passed)
            setStep("result")

            if (data.passed) {
                toast({
                    title: "Assessment Passed!",
                    description: `You verified your ${skillName} skill.`,
                })
                onVerified()
                router.refresh()
            }
        } catch (err) {
            console.error("Submission error:", err)
            setError("Failed to submit results. Please try again.")
            setStep("quiz")
        }
    }

    const reset = () => {
        setStep("intro")
        setQuestions([])
        setAnswers([])
        setScore(0)
        setError(null)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border shadow-popup z-50">

                {step === "intro" && (
                    <>
                        <DialogHeader>
                            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                                <Award className="w-6 h-6 text-primary" />
                            </div>
                            <DialogTitle className="text-center">Verify {skillName}</DialogTitle>
                            <DialogDescription className="text-center">
                                Take a quick AI-generated quiz to verify your <strong>{level}</strong> proficiency level.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-3">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Pass with 80% or higher score</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Get a "Verified" badge on your profile</span>
                            </div>
                            {error && (
                                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={startAssessment} className="gradient-primary">Start Quiz</Button>
                        </DialogFooter>
                    </>
                )}

                {step === "loading" && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <h3 className="font-semibold">Generating Questions...</h3>
                        <p className="text-sm text-muted-foreground mt-1">Our AI is crafting a unique quiz for you.</p>
                    </div>
                )}

                {step === "quiz" && questions.length > 0 && (
                    <>
                        <DialogHeader>
                            <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                                <span>{Math.round(((currentQuestionIndex) / questions.length) * 100)}% completed</span>
                            </div>
                            <Progress value={((currentQuestionIndex) / questions.length) * 100} className="h-2" />
                        </DialogHeader>

                        <div className="py-6">
                            <h3 className="font-medium text-lg mb-4">{questions[currentQuestionIndex].text}</h3>

                            <RadioGroup
                                value={answers[currentQuestionIndex]?.toString()}
                                onValueChange={(val) => handleAnswer(parseInt(val))}
                                className="space-y-3"
                            >
                                {questions[currentQuestionIndex].options.map((option, idx) => (
                                    <div key={idx} className={`flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors ${answers[currentQuestionIndex] === idx ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                        <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} />
                                        <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-normal">{option}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={nextQuestion}
                                className="w-full"
                                disabled={answers[currentQuestionIndex] === undefined || answers[currentQuestionIndex] === -1}
                            >
                                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Submit Assessment"}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === "submitting" && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                        <h3 className="font-semibold">Verifying Answers...</h3>
                    </div>
                )}

                {step === "result" && (
                    <>
                        <DialogHeader>
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${passed ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
                                {passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                            </div>
                            <DialogTitle className="text-center text-2xl">{passed ? "Assessment Passed!" : "Assessment Failed"}</DialogTitle>
                            <DialogDescription className="text-center">
                                You scored {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 text-center">
                            {passed ? (
                                <p className="text-muted-foreground">
                                    Congratulations! You have successfully verified your <strong>{skillName}</strong> skill. A badge has been added to your profile.
                                </p>
                            ) : (
                                <p className="text-muted-foreground">
                                    Don't worry! You can try again later to verify this skill. Review the topic and come back stronger.
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button onClick={() => onOpenChange(false)} className="w-full">
                                {passed ? "Explore More" : "Close"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
