import { Mic, Zap, Brain, Clock, ArrowRight, CheckCircle, Users, Building2, ListTodo, BarChart3, Shield, Sparkles, ChevronRight, Smartphone } from "lucide-react";
import logoImg from "@/assets/images/logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] },
  }),
};

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = Math.ceil(target / 40);
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(current);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [started, target]);

  return (
    <motion.span
      onViewportEnter={() => setStarted(true)}
      viewport={{ once: true }}
    >
      {count}{suffix}
    </motion.span>
  );
}

function FloatingOrb({ className }: { className: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 dark:opacity-10 pointer-events-none ${className}`} />
  );
}

function WaveformAnimation() {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-emerald-500 to-cyan-400"
          animate={{
            height: [4, Math.random() * 28 + 4, 4],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="VoiceCRM" className="w-10 h-10 rounded-md" />
            <span className="text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Voice</span>
              <span>CRM</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth">
              <Button data-testid="button-login">Entrar</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-28 pb-24 px-6 overflow-hidden">
        <FloatingOrb className="w-[600px] h-[600px] bg-emerald-500 -top-40 -left-40" />
        <FloatingOrb className="w-[500px] h-[500px] bg-cyan-500 top-20 -right-40" />
        <FloatingOrb className="w-[300px] h-[300px] bg-violet-500 bottom-0 left-1/3" />

        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.15] mb-8"
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              data-testid="text-hero-title"
            >
              Fale. A IA{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                organiza tudo
              </span>{" "}
              pra você.
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
            >
              Grave um áudio rápido após cada reunião. Nossa IA transcreve, identifica contatos e empresas, extrai tarefas e decisões. Tudo organizado no seu CRM em segundos.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-4"
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
            >
              <Link href="/auth">
                <div className="group relative inline-flex" data-testid="button-get-started">
                  <div className="absolute -inset-0.5 rounded-md bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 opacity-30 blur-md transition-all duration-500 group-hover:opacity-50" />
                  <Button size="lg" className="relative gap-2 text-base px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0">
                    Comece grátis agora
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </div>
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="mt-20 max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            custom={4}
            variants={scaleIn}
          >
            <Card className="border-0 bg-gradient-to-b from-card to-background relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-violet-500/5 rounded-md" />
              <CardContent className="p-6 md:p-10 relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Gravando reunião...</p>
                    <p className="text-xs text-muted-foreground">00:47 de áudio</p>
                  </div>
                  <WaveformAnimation />
                </div>

                <div className="p-4 rounded-md bg-muted/40 mb-6">
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    "Conversei com o <span className="text-foreground font-medium">Marcos da Silva</span> da <span className="text-foreground font-medium">TechBrasil</span>. Ele quer fechar o contrato até sexta-feira. Preciso enviar a <span className="text-foreground font-medium">proposta atualizada</span> com os novos valores e agendar uma <span className="text-foreground font-medium">call de alinhamento</span> com a equipe técnica dele..."
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-md bg-emerald-500/10 dark:bg-emerald-500/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Contato</p>
                    </div>
                    <p className="text-sm font-semibold">Marcos da Silva</p>
                  </div>
                  <div className="p-3 rounded-md bg-cyan-500/10 dark:bg-cyan-500/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building2 className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                      <p className="text-[11px] text-cyan-700 dark:text-cyan-400 font-medium">Empresa</p>
                    </div>
                    <p className="text-sm font-semibold">TechBrasil</p>
                  </div>
                  <div className="p-3 rounded-md bg-amber-500/10 dark:bg-amber-500/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ListTodo className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Tarefa</p>
                    </div>
                    <p className="text-sm font-semibold">Enviar proposta</p>
                  </div>
                  <div className="p-3 rounded-md bg-violet-500/10 dark:bg-violet-500/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                      <p className="text-[11px] text-violet-700 dark:text-violet-400 font-medium">Prazo</p>
                    </div>
                    <p className="text-sm font-semibold">Sexta-feira</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: 10, suffix: "x", label: "mais rápido que digitar" },
              { value: 95, suffix: "%", label: "precisão na transcrição" },
              { value: 30, suffix: "s", label: "para organizar uma reunião" },
              { value: 100, suffix: "%", label: "automático com IA" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                variants={fadeUp}
              >
                <p className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent" data-testid={`stat-value-${i}`}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative overflow-hidden">
        <FloatingOrb className="w-[400px] h-[400px] bg-emerald-500 -bottom-20 -right-20" />

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={0}
            variants={fadeUp}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4" data-testid="text-how-it-works">
              Três passos. Zero esforço.
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Da reunião à ação em menos de um minuto
            </p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            <div className="absolute left-[19px] md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px bg-gradient-to-b from-emerald-500/40 via-cyan-500/40 to-violet-500/40" />

            {[
              {
                icon: Mic,
                step: "01",
                title: "Grave um áudio",
                description: "Saiu da reunião? Abra o app e conte o que aconteceu. Sem digitar, sem formulários, sem burocracia. Fale naturalmente como se estivesse contando para um colega.",
                gradient: "from-emerald-500 to-teal-500",
                color: "text-emerald-500",
              },
              {
                icon: Brain,
                step: "02",
                title: "A IA processa tudo",
                description: "Inteligência artificial avançada transcreve o áudio, identifica pessoas e empresas mencionadas, extrai tarefas e prazos, e organiza decisões importantes.",
                gradient: "from-cyan-500 to-blue-500",
                color: "text-cyan-500",
              },
              {
                icon: Zap,
                step: "03",
                title: "CRM atualizado",
                description: "Contatos criados, empresas vinculadas, tarefas na fila e decisões registradas. Tudo automático. Abra o CRM e veja tudo organizado, pronto para ação.",
                gradient: "from-violet-500 to-purple-500",
                color: "text-violet-500",
              },
            ].map((feature, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={feature.step}
                  className={`relative flex items-start gap-8 mb-20 last:mb-0 pl-14 md:pl-0 ${isLeft ? "md:flex-row md:pr-[calc(50%+3rem)]" : "md:flex-row-reverse md:pl-[calc(50%+3rem)]"}`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  custom={i}
                  variants={isLeft ? slideFromLeft : slideFromRight}
                  data-testid={`step-${feature.step}`}
                >
                  <div className={`absolute left-2 md:left-1/2 top-1 w-9 h-9 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center md:-translate-x-1/2 z-10 ring-4 ring-background`}>
                    <feature.icon className="h-4 w-4 text-white" />
                  </div>

                  <div className="flex-1">
                    <span className={`text-sm font-bold tracking-widest uppercase ${feature.color}`}>Passo {feature.step}</span>
                    <h3 className="text-2xl md:text-3xl font-bold mt-2 mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base md:text-lg">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={0}
            variants={fadeUp}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Tudo que você precisa.{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">Nada que não precisa.</span>
            </h2>
          </motion.div>

          <div className="space-y-20">
            {[
              {
                icon: Mic,
                title: "Gravação Inteligente",
                description: "Grave com um toque. Pause e retome quando quiser. Auto-pausa quando o celular toca ou a tela desliga.",
                color: "text-emerald-500",
                borderColor: "from-emerald-500 to-teal-500",
              },
              {
                icon: Brain,
                title: "Transcrição com IA",
                description: "Áudio convertido em texto com precisão impressionante. Suporte completo para português brasileiro.",
                color: "text-cyan-500",
                borderColor: "from-cyan-500 to-blue-500",
              },
              {
                icon: Users,
                title: "Contatos Automáticos",
                description: "Mencionou alguém no áudio? O contato é criado automaticamente e vinculado à reunião.",
                color: "text-blue-500",
                borderColor: "from-blue-500 to-indigo-500",
              },
              {
                icon: Building2,
                title: "Empresas Organizadas",
                description: "Empresas identificadas e criadas automaticamente. Contatos agrupados por empresa.",
                color: "text-violet-500",
                borderColor: "from-violet-500 to-purple-500",
              },
              {
                icon: ListTodo,
                title: "Tarefas Extraídas",
                description: "A IA identifica compromissos, prazos e ações mencionadas e cria tarefas automaticamente.",
                color: "text-amber-500",
                borderColor: "from-amber-500 to-orange-500",
              },
              {
                icon: BarChart3,
                title: "Relatórios Visuais",
                description: "Acompanhe reuniões por mês, veja resumos e métricas do seu CRM em gráficos intuitivos.",
                color: "text-rose-500",
                borderColor: "from-rose-500 to-pink-500",
              },
            ].map((feature, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={feature.title}
                  className={`flex flex-col gap-4 ${isLeft ? "md:flex-row md:text-left" : "md:flex-row-reverse md:text-right"} items-start md:items-center`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  custom={0}
                  variants={isLeft ? slideFromLeft : slideFromRight}
                  data-testid={`feature-${i}`}
                >
                  <div className={`shrink-0 flex ${isLeft ? "md:justify-start" : "md:justify-end"}`}>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.borderColor} flex items-center justify-center`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div className={`flex-1 ${isLeft ? "" : ""}`}>
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-lg">{feature.description}</p>
                  </div>
                  <div className={`hidden md:block w-48 h-px bg-gradient-to-r ${feature.borderColor} opacity-30 shrink-0`} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative overflow-hidden">
        <FloatingOrb className="w-[500px] h-[500px] bg-violet-500 -top-20 -left-40" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={0}
              variants={fadeUp}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
                Você perde informação valiosa{" "}
                <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">todo dia</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Sai da reunião, pega trânsito, chega no escritório e já esqueceu metade do que foi combinado. Nomes, prazos, decisões... tudo perdido. Até agora.
              </p>
              <ul className="space-y-4">
                {[
                  "Registre reuniões em segundos, não em minutos",
                  "Contatos e empresas criados sem digitar nada",
                  "Tarefas e prazos extraídos automaticamente",
                  "Histórico completo de cada contato e empresa",
                  "Funciona offline. Sincroniza quando conectar",
                  "Interface limpa, sem poluição visual",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={1}
              variants={scaleIn}
            >
              <div className="space-y-4">
                <Card className="border-0 bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">MS</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Marcos da Silva</p>
                        <p className="text-xs text-muted-foreground">TechBrasil · Diretor Comercial</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">3 reuniões</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Última reunião</span>
                        <span className="font-medium">Hoje, 14:30</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Tarefas pendentes</span>
                        <span className="font-medium text-amber-500">2 tarefas</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">AC</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Ana Costa</p>
                        <p className="text-xs text-muted-foreground">InovaSoft · Product Manager</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">5 reuniões</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Última reunião</span>
                        <span className="font-medium">Ontem, 10:00</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Decisões registradas</span>
                        <span className="font-medium text-emerald-500">4 decisões</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">RP</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Ricardo Pereira</p>
                        <p className="text-xs text-muted-foreground">Construtora Alfa · Engenheiro</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">1 reunião</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Última reunião</span>
                        <span className="font-medium">Seg, 16:00</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium text-emerald-500">Ativo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-card/50 border-t">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={0}
            variants={fadeUp}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Feito para quem não tem tempo a perder
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Segurança Total",
                description: "Seus dados são criptografados e protegidos. Cada usuário tem acesso apenas às suas próprias informações. Privacidade é prioridade.",
              },
              {
                icon: Smartphone,
                title: "Mobile-First",
                description: "Projetado para o celular primeiro. Abra o app e comece a gravar instantaneamente. Adicione à tela inicial e use como app nativo.",
              },
              {
                icon: Clock,
                title: "Economize Horas",
                description: "Pare de escrever atas de reunião. Pare de preencher planilhas. Fale por 30 segundos e economize 30 minutos de trabalho manual.",
              },
              {
                icon: Sparkles,
                title: "IA de Ponta",
                description: "Utiliza os modelos mais avançados de inteligência artificial para transcrição e análise. Precisão impressionante em português brasileiro.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="flex items-start gap-5 p-6"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                variants={fadeUp}
              >
                <div className="shrink-0 w-12 h-12 rounded-md bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative overflow-hidden">
        <FloatingOrb className="w-[600px] h-[600px] bg-emerald-500 top-0 left-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto relative text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={0}
            variants={fadeUp}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
              Pronto para nunca mais{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                perder uma informação
              </span>
              ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Junte-se a profissionais que já transformaram a forma como registram reuniões. Comece agora, é grátis.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/auth">
                <Button size="lg" className="gap-2 text-base px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 border-emerald-500" data-testid="button-cta-final">
                  Criar conta gratuita
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Sem cartão de crédito. Sem compromisso. Cancele quando quiser.
            </p>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="VoiceCRM" className="w-8 h-8 rounded-md" />
              <span className="text-sm font-bold">
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Voice</span>
                <span>CRM</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} VoiceCRM. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

