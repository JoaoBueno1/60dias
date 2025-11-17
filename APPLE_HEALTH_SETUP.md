# 🍎 Configuração Apple Health Sync (AUTOMÁTICO)

## ✨ O QUE VAI ACONTECER:

Todo dia às **8:00 da manhã**, seu iPhone vai automaticamente:
1. Ler dados do Apple Health
2. Sincronizar com o app PWA
3. Preencher peso, passos, calorias, exercício automaticamente
4. **VOCÊ NÃO FAZ NADA!**

---

## 📱 SETUP (Uma vez - 3 minutos)

### PASSO 1: Instalar o PWA

✅ **Seu app já está publicado online!**

1. Abra Safari no iPhone
2. Acesse: **https://joaobueno1.github.io/60dias/**
3. Clique em **Compartilhar** (ícone de seta pra cima)
4. Role e clique em **"Adicionar à Tela Inicial"**
5. Confirme
6. Pronto! App instalado como nativo 📱

---

### PASSO 2: Criar o Atalho (Shortcut)

1. Abra o app **"Atalhos"** (Shortcuts) no iPhone
2. Toque em **"+"** (novo atalho)
3. Dê um nome: **"Sync Dieta 60 Dias"**

#### Adicione estas ações (na ordem):

**AÇÃO 1: Obter Dados de Saúde**
```
🔍 Procure: "Obter dados de saúde"
➕ Adicione

Tipo: Peso (Body Mass)
Período: Hoje
Ordem: Mais recente primeiro
Limite: 1
```

**AÇÃO 2: Calcular Estatísticas**
```
🔍 Procure: "Calcular estatísticas"
➕ Adicione

Variável: Dados de Saúde (anterior)
Tipo: Média
```

**AÇÃO 3: Definir Variável (Peso)**
```
🔍 Procure: "Definir variável"
➕ Adicione

Nome: Peso
Valor: Resultado da Estatística
```

**AÇÃO 4: Obter Dados de Saúde (Passos)**
```
🔍 Procure: "Obter dados de saúde"
➕ Adicione

Tipo: Contagem de Passos (Step Count)
Período: Hoje
Ordem: Mais recente primeiro
```

**AÇÃO 5: Calcular Estatísticas (Passos)**
```
🔍 Procure: "Calcular estatísticas"
➕ Adicione

Tipo: Soma
```

**AÇÃO 6: Definir Variável (Passos)**
```
🔍 Procure: "Definir variável"
➕ Adicione

Nome: Passos
Valor: Resultado da Estatística
```

**AÇÃO 7: Obter Dados de Saúde (Calorias Ativas)**
```
🔍 Procure: "Obter dados de saúde"
➕ Adicione

Tipo: Energia Ativa Queimada (Active Energy)
Período: Hoje
```

**AÇÃO 8: Calcular Estatísticas (Calorias)**
```
🔍 Procure: "Calcular estatísticas"
➕ Adicione

Tipo: Soma
```

**AÇÃO 9: Definir Variável (Calorias)**
```
🔍 Procure: "Definir variável"
➕ Adicione

Nome: Calorias
Valor: Resultado da Estatística
```

**AÇÃO 10: Obter Dados de Saúde (Minutos de Exercício)**
```
🔍 Procure: "Obter dados de saúde"
➕ Adicione

Tipo: Minutos de Exercício (Exercise Minutes)
Período: Hoje
```

**AÇÃO 11: Calcular Estatísticas (Exercício)**
```
🔍 Procure: "Calcular estatísticas"
➕ Adicione

Tipo: Soma
```

**AÇÃO 12: Definir Variável (Exercício)**
```
🔍 Procure: "Definir variável"
➕ Adicione

Nome: Exercicio
Valor: Resultado da Estatística
```

**AÇÃO 13: Texto (Montar URL)**
```
🔍 Procure: "Texto"
➕ Adicione

Cole isso (não altere nada):
```
index.html?weight=Peso&steps=Passos&activeCalories=Calorias&exercise=Exercicio
```

Depois toque nas palavras coloridas e selecione as variáveis:
- Peso → Variável "Peso"
- Passos → Variável "Passos"
- Calorias → Variável "Calorias"
- Exercicio → Variável "Exercicio"
```

**AÇÃO 14: Abrir URLs**
```
🔍 Procure: "Abrir URLs"
➕ Adicione

URL: Texto (da ação anterior)
```

5. Toque em **"Concluir"**
6. Atalho criado! ✅

---

### PASSO 3: Configurar Automação

1. No app Atalhos, vá na aba **"Automação"** (embaixo)
2. Toque em **"+"** (Nova Automação)
3. Escolha **"Criar Automação Pessoal"**

4. Selecione: **"Hora do Dia"**
   - Hora: **08:00**
   - Repetir: **Todos os dias**
   - Toque em "Avançar"

5. **"Adicionar Ação"**
   - Procure: **"Executar Atalho"**
   - Selecione o atalho: **"Sync Dieta 60 Dias"**

6. Toque em **"Avançar"**

7. **IMPORTANTE:**
   - Desative: **"Perguntar Antes de Executar"**
   - Ative: **"Notificar quando executar"** (opcional)

8. Toque em **"Concluir"**

---

### PASSO 4: Dar Permissões ao Atalho

1. Abra **Ajustes** (Settings) > **Privacidade e Segurança**
2. Toque em **"Saúde"**
3. Toque em **"Atalhos"** (Shortcuts)
4. Ative as permissões:
   - ✅ Peso (Body Mass)
   - ✅ Contagem de Passos
   - ✅ Energia Ativa Queimada
   - ✅ Minutos de Exercício
   - ✅ Distância Percorrida (opcional)
   - ✅ Frequência Cardíaca (opcional)
   - ✅ Análise do Sono (opcional)

---

## 🚀 COLOCANDO NO GITHUB PAGES (Para funcionar de verdade)

**Por que?** O PWA precisa estar em um servidor HTTPS para funcionar completamente.

### Opção A: GitHub Pages (GRÁTIS e FÁCIL)

1. Abra o Terminal (pasta dieta):
```bash
cd /Users/joaomarcos/Desktop/dieta

# Inicializa git (se ainda não fez)
git init
git add .
git commit -m "App fitness completo"

# Cria repositório no GitHub
# Vai em github.com → Novo repositório → "fitness-60dias"
# Depois:
git remote add origin https://github.com/SEU_USUARIO/fitness-60dias.git
git branch -M main
git push -u origin main
```

2. No GitHub:
   - Settings → Pages
   - Source: main branch
   - Save

3. ✅ **Seu app já está online em:**
   `https://joaobueno1.github.io/60dias/`

4. **IMPORTANTE: Use esta URL no Shortcut (Ação 13):**
   ```
   https://joaobueno1.github.io/60dias/index.html?weight=Peso&steps=Passos&activeCalories=Calorias&exercise=Exercicio
   ```

---

## ✅ TESTANDO

1. Execute o atalho manualmente:
   - Abra Atalhos
   - Toque no atalho "Sync Dieta 60 Dias"
   - Ele deve abrir o app e mostrar: **"Sincronizado com Apple Health! ✅"**

2. Se funcionou, pronto! Amanhã às 8h ele executa sozinho!

---

## 💡 DICAS

### Dados que SINCRONIZAM automaticamente:
- ✅ **Peso** (da balança inteligente conectada ao Health)
- ✅ **Passos** (iPhone conta sozinho)
- ✅ **Calorias Ativas** (do Apple Watch ou iPhone)
- ✅ **Minutos de Exercício** (detectado automaticamente)

### O que você FAZ MANUALMENTE (no app):
- ❌ Checkboxes: Dieta, Treino, Cardio (subjetivo)
- ❌ Widget de Água: 8 copos
- ❌ Medidas Semanais: braços, cintura, peito, coxa (fita métrica)
- ❌ Notas do dia (opcional)

---

## 🆘 PROBLEMAS?

**"O atalho não funciona"**
- Verifique permissões em Ajustes → Privacidade → Saúde → Atalhos

**"Automação não executa"**
- Certifique-se que desativou "Perguntar Antes de Executar"
- iPhone precisa estar desbloqueado às 8h (ou executará quando desbloquear)

**"App não abre"**
- Use GitHub Pages (explicado acima)
- Ou teste localmente em: Safari → Arquivo → Abrir

**"Dados não aparecem"**
- Verifique se o Apple Health tem os dados
- Teste o atalho manualmente primeiro

---

## 🎉 RESULTADO FINAL

**Seu dia a dia:**
- **08:00** - iPhone sincroniza em background (você nem percebe)
- **19:00** - Você abre o app
- **19:01** - Peso, passos, calorias JÁ ESTÃO PREENCHIDOS! ✅
- **19:02** - Você só marca: ✅ Dieta ✅ Treino ✅ Cardio 💧 Água
- **Segunda** - Adiciona medidas semanais

**SEM PRECISAR DIGITAR PESO TODO DIA!** 🚀

---

## 📊 DADOS EXTRAS (Opcional)

Quer adicionar mais dados? No Passo 2, adicione estas ações:

**Distância:**
```
Obter Dados de Saúde → Distância de Caminhada + Corrida
Calcular Estatísticas → Soma
Definir Variável → "Distancia"
```

**Sono:**
```
Obter Dados de Saúde → Análise do Sono (ontem)
Calcular Estatísticas → Soma
Definir Variável → "Sono"
```

**Frequência Cardíaca:**
```
Obter Dados de Saúde → Frequência Cardíaca
Calcular Estatísticas → Média
Definir Variável → "FC"
```

E adicione no Texto (Ação 13):
```
&distance=Distancia&sleep=Sono&heartRate=FC
```

---

**Pronto! Agora é só usar! 💪🚀**
