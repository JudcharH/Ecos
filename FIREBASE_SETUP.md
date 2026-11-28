# Firebase do ECO

Para ativar criação de conta, login com Google e sincronização:

1. Crie um projeto no Firebase e registre um aplicativo Web.
2. Em **Authentication > Sign-in method**, ative **E-mail/senha** e **Google**.
3. Crie um banco **Cloud Firestore**.
4. Copie a configuração pública do aplicativo para `firebase-config.js`.

```js
window.ECO_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

Use regras do Firestore que restrinjam cada perfil ao próprio usuário:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Adicione também o domínio publicado do ECO em **Authentication > Settings > Authorized domains**.

## Convites online

Este repositório inclui `firestore.rules`, que mantém a regra de `/users/{uid}`
e adiciona permissões específicas para convites, metadados de campanha e
participantes. Antes de publicar, compare o arquivo com as regras atuais e
preserve eventuais regras adicionais. Não use modo de teste.

Com as regras publicadas, o mestre deve entrar na conta do ECO, abrir a
campanha no navegador de origem e clicar em **Convidar**. O link e o novo
código podem ser usados por outra conta autenticada. Códigos locais antigos
não são migrados automaticamente. O convite não envia a senha de mestre,
personagens, chat nem estado do combate: esta etapa compartilha o cadastro da
campanha, não sincroniza a sessão em tempo real.
