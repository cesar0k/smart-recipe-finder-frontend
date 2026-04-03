import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6 px-4">
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-extrabold text-gray-900">500</h1>
        <h2 className="text-2xl font-bold text-gray-900">
          {t("error_title")}
        </h2>
        <p className="text-gray-500 max-w-md">
          {t("error_desc")}
        </p>
      </div>
      <Button
        onClick={() => window.location.reload()}
        className="rounded-full"
      >
        {t("error_reload")}
      </Button>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
