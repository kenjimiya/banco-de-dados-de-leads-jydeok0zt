import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, RefreshCw, Lightbulb, AlertCircle } from 'lucide-react'
import { getSalesInsights } from '@/services/api'

export function AiInsightsPanel() {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchInsights = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getSalesInsights()
      const lines = (res.insights || '')
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0)
      setInsights(lines)
    } catch {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  return (
    <Card className="border-none shadow-subtle">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          Insights com IA
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={fetchInsights}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-4 bg-secondary/50 rounded animate-pulse"
                style={{ width: `${80 + i * 5}%` }}
              />
            ))}
          </div>
        )}
        {error && !loading && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Não foi possível carregar insights. Tente novamente.</span>
          </div>
        )}
        {!loading && !error && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{insight.replace(/^[•\-*]\s*/, '')}</span>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && insights.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum insight disponível no momento.</p>
        )}
      </CardContent>
    </Card>
  )
}
