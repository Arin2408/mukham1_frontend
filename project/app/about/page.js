import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Building2, Users, Shield, Globe } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              About Mukham
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Mukham is a comprehensive organization management platform designed to streamline 
              workforce operations, enhance productivity, and simplify administrative tasks.
            </p>
            <Link href="/register">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-24 bg-muted">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-3xl font-bold">Our Values</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built on principles that put your organization's success first
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <Card className="p-8">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Security First</h3>
                <p className="text-muted-foreground">
                  Enterprise-grade security measures to protect your organization's data
                </p>
              </Card>

              <Card className="p-8">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">People Focused</h3>
                <p className="text-muted-foreground">
                  Designed with both administrators and employees in mind
                </p>
              </Card>

              <Card className="p-8">
                <Building2 className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Scalable Solution</h3>
                <p className="text-muted-foreground">
                  Grows with your organization, from startups to enterprises
                </p>
              </Card>

              <Card className="p-8">
                <Globe className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Global Reach</h3>
                <p className="text-muted-foreground">
                  Supporting organizations worldwide with localized features
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of organizations already using Mukham to manage their workforce effectively.
            </p>
            <Link href="/register">
              <Button size="lg">Try Mukham Now</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}