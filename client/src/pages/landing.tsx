import { Mic, Zap, Brain, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: Mic,
    title: "Grave com a Voz",
    description: "Saia da reunião, abra o app e grave um áudio contando o que aconteceu. Sem digitar nada.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "IA Organiza Tudo",
    description: "Transcrição automática, identificação de contatos, empresas, decisões e tarefas em segundos.",
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    icon: Zap,
    title: "Ação Imediata",
    description: "Reuniões se transformam em tarefas organizadas. Nada mais se perde entre a reunião e a ação.",
    color: "text-chart-4",
    bg: "bg-chart-4/10",
  },
];

const benefits = [
  "Registre reuniões em segundos, não em minutos",
  "Contatos e empresas criados automaticamente",
  "Tarefas extraídas direto da conversa",
  "Histórico completo de cada contato",
  "Zero poluição visual, tudo organizado",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Mic className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">VoiceCRM</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/api/login">
              <Button data-testid="button-login">Entrar</Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Mic className="h-3.5 w-3.5" />
              CRM inteligente por voz
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6" data-testid="text-hero-title">
              Suas reuniões viram{" "}
              <span className="text-primary">ações concretas</span>{" "}
              em segundos
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Grave um áudio após a reunião e a inteligência artificial transcreve, identifica contatos e empresas, e organiza tudo automaticamente no seu CRM.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="/api/login">
                <Button size="lg" className="gap-2" data-testid="button-get-started">
                  Começar agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Como funciona</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Três passos simples para nunca mais perder informação de reunião
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} className="border-0 bg-background">
                <CardContent className="p-8">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-md ${feature.bg} mb-6`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Passo {index + 1}</div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Chega de escrever relatórios de reunião
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Você sai da reunião, pega trânsito, chega em casa e já esqueceu metade do que foi discutido. Com o VoiceCRM, basta gravar um áudio rápido e tudo fica organizado.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-0 bg-card">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mic className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Áudio gravado</p>
                      <p className="text-xs text-muted-foreground">Há 2 minutos</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-md bg-accent/50">
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "Estive em reunião com o Ramiro da Duel, conversamos sobre o prazo da obra do bloco C..."
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-primary/5">
                      <p className="text-xs text-muted-foreground mb-1">Contato</p>
                      <p className="text-sm font-medium">Ramiro</p>
                    </div>
                    <div className="p-3 rounded-md bg-chart-3/5">
                      <p className="text-xs text-muted-foreground mb-1">Empresa</p>
                      <p className="text-sm font-medium">Duel</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-chart-4/5">
                    <p className="text-xs text-muted-foreground mb-1">Tarefa extraída</p>
                    <p className="text-sm font-medium">Enviar orçamento atualizado</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Prazo: Sexta-feira
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
              <Mic className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">VoiceCRM</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} VoiceCRM. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
