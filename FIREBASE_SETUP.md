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
