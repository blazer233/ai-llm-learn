import { Layout as TLayout } from "tdesign-react";
import { CheckCircleIcon } from "tdesign-icons-react";
import "tdesign-react/dist/tdesign.css";

import "./Layout.css";

const { Header, Content, Footer } = TLayout;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TLayout style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Header
        style={{
          backgroundColor: "#0052D9",
          color: "white",
          padding: "24px 48px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <CheckCircleIcon size="32px" />
            <div>
              <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 600 }}>Todo 应用</h1>
            </div>
          </div>
        </div>
      </Header>

      <Content
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "48px 24px",
          width: "100%",
        }}
      >
        {children}
      </Content>

      <Footer
        style={{
          backgroundColor: "#f3f3f3",
          textAlign: "center",
          padding: "24px",
          color: "#666",
          borderTop: "1px solid #e7e7e7",
        }}
      >
        <p style={{ margin: 0 }}>© 2024 Todo 应用 | 基于 Vike + React + TDesign + MySQL</p>
      </Footer>
    </TLayout>
  );
}
