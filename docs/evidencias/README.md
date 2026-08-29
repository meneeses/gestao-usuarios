# Evidências locais

As imagens desta pasta são geradas pelo fluxo Playwright e ignoradas pelo Git por serem artefatos temporários e específicos do ambiente.

Depois de `npm install` e `npm run setup`, execute:

```bash
npm run test:e2e
```

O fluxo produz:

- `01-login.png`;
- `02-dashboard-administrador.png`;
- `03-dashboard-operador.png`;
- `04-dashboard-cliente.png`;
- `05-swagger.png`;
- `06-resposta-403.png`.

Antes da entrega, confira se e-mails e nomes de demonstração estão corretos e se nenhum token aparece nas capturas.
