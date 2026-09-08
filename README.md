# GitOps Demo App

Aplicacao Node.js pequena e stateless criada para validar, com seguranca, um fluxo de CI/CD e GitOps em laboratorio. Ela nao usa banco de dados, Redis, volumes, segredos ou acesso direto do CI ao cluster.

## Arquitetura

```text
Developer -> GitHub -> GitHub Actions -> GHCR
                 ^                         |
                 |                         v
                 +-- manifesto com SHA <- build
                              |
                              v
                       Argo CD (manual)
                              |
                              v
                Kubernetes / argocd-test
```

Em cada push de aplicacao para `main`, o GitHub Actions instala as dependencias, executa os testes, constrói a imagem e a publica em `ghcr.io/<owner>/gitops-demo-app:<commit-sha>`. Depois, altera somente `spec.template.spec.containers[].image` em `k8s/deployment.yaml` e cria um commit `[skip ci]`. Esse commit nao inicia outro build por causa da mensagem e do `paths-ignore` do workflow.

O CI nunca acessa Kubernetes ou Argo CD. O Argo CD observa o Git, exibe a aplicacao como `OutOfSync` e aguarda o administrador executar o primeiro `Sync` manualmente. Nao ha `automated`, `prune` ou `selfHeal` no manifesto da Application.

## Requisitos

- Node.js 22 ou superior e npm
- Docker, apenas para executar a imagem localmente
- Um namespace `argocd-test` e um AppProject `argocd-test` previamente administrados no Argo CD
- Permissao do GitHub Actions para leitura e escrita no repositorio

O repositorio nao cria o namespace nem recursos de escopo de cluster. Confirme também que o pacote GHCR pode ser lido pelos nodes do cluster; para este laboratorio, a opcao mais simples é tornar o pacote publico.

## Executar e testar localmente

```bash
npm ci
npm test
npm start
```

Em outro terminal:

```bash
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/version
```

As respostas de verificacao sao JSON e retornam HTTP 200. Sem variaveis de ambiente, `/version` usa a versao do `package.json`, commit `local` e ambiente `local`.

## Construir a imagem

```bash
docker build \
  --build-arg BUILD_VERSION=1.0.0 \
  --build-arg COMMIT_SHA=$(git rev-parse HEAD) \
  -t gitops-demo-app:local .

docker run --rm -p 3000:3000 gitops-demo-app:local
```

O container usa um usuario sem privilegios, filesystem raiz somente leitura no Deployment, todas as capabilities removidas e perfil seccomp `RuntimeDefault`.

## Primeiro build e implantacao manual

O manifesto começa com uma tag SHA sentinela. O primeiro workflow bem-sucedido publica a imagem real e substitui essa tag pelo SHA completo do commit. Depois que o commit GitOps chegar a `main`, confira a diferenca no Argo CD e faça o `Sync` manual pela interface administrativa.

O manifesto `argocd/application.yaml` é um recurso administrativo e deve ser cadastrado pelo administrador do Argo CD. Ele aponta exclusivamente para o path `k8s`, para o cluster configurado e para o namespace `argocd-test`.

## Consultar o laboratorio

Use estes comandos apenas no contexto correto do cluster de laboratorio:

```bash
kubectl get deployment,replicaset,pod,service -n argocd-test
kubectl rollout status deployment/gitops-demo-app -n argocd-test
kubectl logs deployment/gitops-demo-app -n argocd-test
kubectl port-forward service/gitops-demo-app 3000:3000 -n argocd-test
```

O workflow não executa nenhum desses comandos.

## Rollback via Git

Identifique o commit GitOps que alterou a imagem e reverta-o:

```bash
git log --oneline -- k8s/deployment.yaml
git revert <commit-gitops>
git push origin main
```

O Argo CD detectara o retorno da tag anterior. Revise a diferenca e execute o `Sync` manual. Como as tags usam o SHA completo, a versao anterior permanece inequivocamente identificavel.

## Estrutura

```text
.
|-- .github/workflows/ci.yml
|-- argocd/application.yaml
|-- k8s/deployment.yaml
|-- k8s/kustomization.yaml
|-- k8s/service.yaml
|-- src/app.js
|-- src/server.js
|-- tests/app.test.js
|-- .dockerignore
|-- .gitignore
|-- Dockerfile
|-- package-lock.json
|-- package.json
`-- README.md
```

Nenhuma credencial, token, kubeconfig ou segredo deve ser adicionado a este repositorio.

