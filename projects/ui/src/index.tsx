import { getHost } from "./helpers/utils";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { ConfigProvider } from "antd";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { RecoilRoot } from "recoil";
import "./i18n/config";
import "./index.css";
import { router } from "./routes";

const apolloClient = new ApolloClient({
  uri: `${getHost()}/graphql`,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <RecoilRoot>
        <ConfigProvider>
          <RouterProvider router={router} />
        </ConfigProvider>
      </RecoilRoot>
    </ApolloProvider>
  </React.StrictMode>,
);
