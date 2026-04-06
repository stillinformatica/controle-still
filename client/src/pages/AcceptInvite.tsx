import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, Users, LogIn, Mail } from "lucide-react";

export default function AcceptInvite() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const loginUrl = getLoginUrl();
  const [token, setToken] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [autoAccepting, setAutoAccepting] = useState(false);

  // Extrair token da URL ou do sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let t = params.get("token");
    if (!t) {
      t = sessionStorage.getItem("pendingInviteToken");
    }
    setToken(t);
  }, []);

  const acceptMutation = trpc.collaborators.acceptInvite.useMutation({
    onSuccess: () => {
      sessionStorage.removeItem("pendingInviteToken");
      setAccepted(true);
      toast.success("Convite aceito! Bem-vindo ao sistema.");
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (e) => {
      setAutoAccepting(false);
      toast.error(e.message);
    },
  });

  const acceptByEmailMutation = trpc.collaborators.acceptPendingInvite.useMutation({
    onSuccess: () => {
      sessionStorage.removeItem("pendingInviteToken");
      setAccepted(true);
      toast.success("Convite aceito! Bem-vindo ao sistema.");
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (e) => {
      setAutoAccepting(false);
      toast.error(e.message);
    },
  });

  // Aceitar automaticamente se o usuário está logado e há token pendente
  useEffect(() => {
    const pendingToken = sessionStorage.getItem("pendingInviteToken");
    if (user && pendingToken && !accepted && !acceptMutation.isPending && !autoAccepting) {
      setAutoAccepting(true);
      sessionStorage.removeItem("pendingInviteToken");
      acceptMutation.mutate({ inviteToken: pendingToken });
    }
  }, [user]);

  const handleAccept = () => {
    if (token) {
      acceptMutation.mutate({ inviteToken: token });
    } else if (user) {
      // Fallback: aceitar pelo email do usuário logado
      acceptByEmailMutation.mutate();
    }
  };

  const handleLoginAndAccept = () => {
    if (token) {
      sessionStorage.setItem("pendingInviteToken", token);
      document.cookie = `oauth_return_to=/aceitar-convite?token=${encodeURIComponent(token)};path=/;max-age=600;SameSite=Lax`;
    } else {
      document.cookie = `oauth_return_to=/aceitar-convite;path=/;max-age=600;SameSite=Lax`;
    }
    window.location.href = loginUrl;
  };

  if (accepted || autoAccepting && acceptMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Convite Aceito!</h2>
            <p className="text-muted-foreground">Redirecionando para o sistema...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (autoAccepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ativando acesso...</h2>
            <p className="text-muted-foreground">Aguarde um momento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Convite de Colaborador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Você foi convidado para acessar o <strong>ControlEStill</strong> como colaborador.
          </p>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Para aceitar o convite, faça login com sua conta Google primeiro.
              </p>
              <Button className="w-full" onClick={handleLoginAndAccept}>
                <LogIn className="mr-2 h-4 w-4" />
                Entrar com Google
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">Logado como:</p>
                <p className="text-muted-foreground">{user.name} ({user.email})</p>
              </div>

              {!token && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <p className="font-medium mb-1">Token não encontrado</p>
                  <p>Tentaremos ativar o convite pelo seu email cadastrado.</p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleAccept}
                disabled={acceptMutation.isPending || acceptByEmailMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {acceptMutation.isPending || acceptByEmailMutation.isPending
                  ? "Aceitando..."
                  : token
                  ? "Aceitar Convite"
                  : "Aceitar Convite pelo Email"}
              </Button>

              {!token && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  Ir para o Dashboard
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Ao aceitar, você terá acesso ao sistema conforme as permissões definidas pelo administrador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
