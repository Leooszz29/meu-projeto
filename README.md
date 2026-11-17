# FitZone

**Aplicação web para organização de treinos, acompanhamento de desempenho e evolução física.**

O FitZone é um projeto pessoal desenvolvido com o objetivo de praticar e aprimorar conhecimentos em desenvolvimento web, integração com banco de dados, autenticação de usuários e tecnologias para aplicações progressivas (PWA).

O projeto busca oferecer uma experiência simples e organizada para registrar treinos, acompanhar atividades e consultar a evolução ao longo do tempo.

**Aplicação:** https://leooszz29.github.io/meu-projeto/

**Repositório:** https://github.com/Leooszz29/meu-projeto

---

## Objetivos do projeto

- Aplicar conhecimentos de HTML, CSS e JavaScript.
- Desenvolver funcionalidades com persistência de dados.
- Praticar integração com serviços externos e APIs.
- Implementar autenticação e controle de acesso.
- Trabalhar com armazenamento e recuperação de informações.
- Aprender conceitos de PWA, cache e funcionamento offline.
- Praticar organização, manutenção e evolução de um projeto real.

## Funcionalidades

### Treinos
- Cadastro e gerenciamento de treinos.
- Organização de exercícios e séries.
- Registro de séries concluídas.
- Seleção do treino ativo.

### Calendário
- Visualização e organização das atividades.
- Acompanhamento dos dias de treino.
- Consulta dos registros relacionados às atividades.

### Desempenho
- Histórico de atividades.
- Acompanhamento da evolução.
- Visualização e comparação de informações registradas.

### Biblioteca
- Consulta de exercícios.
- Organização de informações de apoio aos treinos.

### Perfil
- Gerenciamento de informações pessoais.
- Personalização de preferências.
- Configuração de metas e opções da aplicação.

### Backup e restauração
- Recursos para backup dos dados.
- Comparação e importação de informações.
- Ferramentas para recuperação de dados.

## Tecnologias utilizadas

| Tecnologia | Aplicação |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização e responsividade |
| JavaScript | Lógica e funcionalidades |
| Supabase | Autenticação e persistência de dados |
| Git e GitHub | Versionamento e hospedagem do código |
| GitHub Pages | Publicação da aplicação |
| PWA | Instalação e recursos de aplicação progressiva |
| Service Worker | Cache e suporte ao funcionamento offline |

## Estrutura do projeto

```text
meu-projeto/
│
├── index.html
├── login.html
├── cadastro.html
├── perfil.html
├── treinos.html
├── calendario.html
├── desempenho.html
├── biblioteca.html
├── privacidade.html
├── termos.html
├── redefinir-senha.html
├── comparar-migracao.html
├── migracao-preview.html
│
├── css/
│   └── Arquivos de estilização
│
├── js/
│   └── Scripts e funcionalidades
│
├── img/
│   └── Imagens e ícones
│
├── manifest.json
├── sw.js
└── README.md
```

## Integração com Supabase

O FitZone utiliza o Supabase para:

- Autenticação de usuários.
- Gerenciamento de sessões.
- Armazenamento de dados na nuvem.
- Separação dos dados por usuário.
- Controle de acesso por meio de políticas de segurança (RLS).

A configuração do cliente Supabase está centralizada em:

`js/supabase-config.js`

As credenciais públicas utilizadas no navegador não substituem as políticas de segurança do banco de dados. Chaves administrativas, como `service_role`, nunca devem ser expostas no código do frontend.

## Aplicação PWA e funcionamento offline

O projeto possui recursos de Progressive Web App (PWA).

Entre eles:

- Possibilidade de instalação em dispositivos compatíveis.
- Arquivo de manifesto (`manifest.json`).
- Service Worker para gerenciamento de cache.
- Armazenamento de arquivos essenciais para acesso offline.
- Verificação e disponibilização de atualizações da aplicação.

O funcionamento offline depende dos recursos previamente armazenados em cache e não significa que todas as operações que dependem do Supabase estarão disponíveis sem conexão.

## Publicação

O projeto é hospedado pelo GitHub Pages.

A publicação é realizada a partir do repositório:

https://github.com/Leooszz29/meu-projeto

A aplicação pode ser acessada pelo endereço:

https://leooszz29.github.io/meu-projeto/

## Segurança e boas práticas

O desenvolvimento considera alguns princípios importantes:

- Validação de dados no frontend e no backend quando aplicável.
- Autenticação de usuários.
- Políticas RLS para proteção dos registros no Supabase.
- Separação dos dados de cada conta.
- Cuidados com credenciais e informações sensíveis.
- Testes de funcionalidades após alterações.
- Controle de versões utilizando Git.

## Status do projeto

**Em desenvolvimento e aprendizado contínuo.**

O FitZone é um projeto utilizado para estudo, experimentação e aplicação prática de conceitos de desenvolvimento web.

Novas funcionalidades, melhorias de interface, correções e aprimoramentos técnicos podem ser incorporados ao longo do desenvolvimento.

---

Desenvolvido como projeto pessoal de estudo e prática.
