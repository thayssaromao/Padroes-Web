# Fluxo de implementação

- Antes de trabalhar em uma branch de funcionalidade, atualize as referências remotas e sincronize a branch com a versão atual de `feat/design-system`. Preserve alterações locais e resolva conflitos sem substituir a funcionalidade pela base.
- Alterações de estilização, ícones, tipografia, espaçamento e demais padrões visuais devem ser registradas primeiro em `feat/design-system`, cuja revisão é feita no PR do design system. Depois incorpore esses commits à branch de funcionalidade.
- Use `docs/DESIGN.md` como referência dos padrões aprovados. Evite redefinir estilos ou escolher ícones divergentes em branches de páginas.
- Ao sincronizar, use merge ou incorporação de commits que preserve o histórico; não faça force-push sem autorização explícita.
