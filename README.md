<h1 align="center">
   <b>
        <a href="https://inngage.com.br/"><img src="https://inngage.com.br/wp-content/uploads/2022/03/inngage-small.png" /></a><br>
    </b>
</h1>

<p align="center">Pacote Inngage para aplicativos React Native para otimização de campanhas de marketing usando notificações push.</p>

<p align="center">
    <a href="https://inngage.com.br/"><b>Website</b></a> •
    <a href="https://inngage.readme.io/docs/react-native-sdk-20"><b>Documentation</b></a>
</p>

<div align="center">

[![npm version](https://img.shields.io/npm/v/@inngageregistry/inngage-react.svg?style=flat-square)](https://www.npmjs.org/package/@inngageregistry/inngage-react)

</div>

## Instalação
### Ambiente de desenvolvimento 
Antes de começar a utilizar nossa SDK, instale as dependências externas utilizadas:
```bash
"dependencies": {
  "@react-native-async-storage/async-storage": "^1.18.1",
  "@react-native-community/push-notification-ios": "^1.11.0",
  "@react-native-firebase/app": "^17.4.2",
  "@react-native-firebase/messaging": "^17.4.2",
  "react-native-device-info": "^10.6.0",
  "react-native-localize": "^2.2.6",
  "react-native-permissions": "^3.8.0",
  "react-native-push-notification": "^8.1.1",
  "react-native-inappbrowser-reborn": "^3.7.0",
}
```
> 📘 *Recomendação*: Certifique-se de instalar as versões conforme especificado nesta documentação. Para a dependência react-native-inappbrowser-reborn, siga as instruções da seção "Getting Started" na documentação oficial para garantir o funcionamento adequado na abertura de URLs do tipo Weblink. Consulte o link a seguir para mais detalhes:
> 
> <https://www.npmjs.com/package/react-native-inappbrowser-reborn>

### Importando o FCM Token (API Key)
Para aproveitar nossa SDK, será necessário importar o FCM Token (API Key) do seu projeto Firebase em nossa plataforma. Siga o passo a passo neste [link]("https://inngage.readme.io/docs/firebase-console#configura%C3%A7%C3%B5es-do-projeto-firebase") para executar essa ação.

### Instalando o package utilizando o NPM ou YARN

Para adicionar a SDK da Inngage ao seu projeto, execute o seguinte comando utilizando o NPM:
```
npm i @inngageregistry/inngage-react
```
Este comando adiciona a seguinte linha no arquivo _package.json_ de seu pacote:
``` 
"dependencies": {
	"@inngageregistry/inngage-react": "^4.0.0-beta.2",
}
```
> 📘 Se a instalação via `npm` não funcionar corretamente, você pode instalar a dependência utilizando o `yarn`. 
> 📘 

Para instalar a SDK com o yarn, siga os passos abaixo:

1. No arquivo `package.json`, adicione a seguinte dependência em `dependencies`: **"@inngageregistry/inngage-react": "^4.0.0-beta.2"**.
2. No terminal, dentro da pasta do seu projeto, execute o comando: **yarn install**. Isso irá instalar a SDK corretamente.