"use client"

import { signIn, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push("/")
      }
    }
    checkSession()
  }, [router])

  const handleDiscordSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("discord", { callbackUrl: "/" })
    } catch (error) {
      console.error("로그인 오류:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CubicJ Cafe 로그인</CardTitle>
          <CardDescription>
            Discord 계정으로 로그인하여 AI 이미지 생성 서비스를 이용하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleDiscordSignIn}
            disabled={isLoading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
            size="lg"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            {isLoading ? "로그인 중..." : "Discord로 로그인"}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>로그인은 선택사항입니다.</p>
            <p>로그인하지 않아도 AI 이미지 생성을 사용할 수 있습니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}