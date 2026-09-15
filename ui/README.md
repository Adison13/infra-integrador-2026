# Tema visual

Base visual compartilhada pelos oito fronts (Contrato §12.3): **Tailwind CSS v4** com
componentes **shadcn/ui** e ícones **lucide**. Usar é recomendado, não obrigatório — mas um
módulo que ignora o tema parece colado no sistema, e isso aparece na apresentação.

## Como usar no seu front

1. Crie o projeto com Vite, React e TypeScript, e instale o Tailwind v4
   (`tailwindcss` e `@tailwindcss/vite`).
2. Copie [plataforma.css](plataforma.css) para `src/tema/plataforma.css` e importe:

   ```css
   @import "tailwindcss";
   @import "./tema/plataforma.css";
   ```

3. Inicialize o shadcn/ui e adicione só os componentes que for usar:

   ```bash
   npx shadcn@latest init
   npx shadcn@latest add button input table dialog
   ```

   O `init` escreve variáveis de cor no seu CSS principal. **Apague essas variáveis** e
   mantenha apenas o import do `plataforma.css`: as cores e o raio vêm dele.

4. Aplique o tema recebido da casca no `<html>`:

   ```ts
   document.documentElement.dataset.tema = sessao.tema // "claro" | "escuro"
   ```

O módulo de exemplo (`exemplo-modulo/front`) já faz os quatro passos.

## Tipografia

IBM Plex Sans para interface e IBM Plex Mono para códigos, valores e identificadores.
Carregue as fontes no `index.html`; se não carregarem, o tema cai para as fontes do sistema.

## Regras de uso

- Use as cores pelo papel (`bg-primary`, `text-muted-foreground`, `border-border`), nunca
  por valor. É o que faz o tema escuro funcionar sem retrabalho.
- `destructive` é para ação irreversível e erro, não para destaque.
- Ação contextual em gaveta (`sheet`), modal (`dialog`) ou menu rápido tem preferência sobre
  abrir uma tela nova (Prompt Mestre §104).
