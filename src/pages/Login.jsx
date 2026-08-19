import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import styled from 'styled-components';
import blackWhiteMove from '../assets/black_white_move.png';
import { APP_VERSION } from '../config/version';
import { useUserProfile } from '../context/UserProfileContext';
import { clearContaAtivaStorage } from '../services/accountSessionStorage';

const API = import.meta.env.VITE_API_BASE ?? 'https://backend.demo.invalid';

// Styled Components
const Container = styled.div`
  display: flex;
  height: 100vh;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const LeftPanel = styled.div`
  flex: 1;
  background: linear-gradient(to bottom right, rgb(53, 1, 95) 0%, rgb(173, 0, 253) 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 6rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgb(247, 247, 247);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.8);
  width: 100%;
  padding: 2rem;
`;

const Card = styled.form`
  background: rgb(238, 238, 238);
  padding: 2rem 4rem;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-width: 480px;

  @media (max-width: 480px) {
    padding: 2rem;
  }
`;

const LeftImg = styled.img`
  width: 30%;
`;

const LeftTitle = styled.h2`
  color: rgb(255, 255, 255);
  font-weight: 700;
  font-size: 2.5rem;
  margin-bottom: 2.2rem;
`;

const RightTitle = styled.h2`
  color: rgb(120, 1, 199);
  font-weight: 700;
  font-size: 1.8rem;
  margin-bottom: 2.2rem;
`;

const Subtitle = styled.h3`
  color: white;
  font-weight: 400;
  font-size: 1.2rem;
  padding-bottom: 2rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: rgb(59, 0, 126);
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  font-size: 0.9rem;
  color: rgb(211, 198, 202);
  background-color: rgb(230, 227, 228);
  outline-offset: 2px;

  &:focus {
    outline: none;
    border-color: rgb(136, 10, 240);
    box-shadow: 0 0 0 1px rgb(105, 0, 153);
    background-color: white;
    color: #111827;
  }
`;

const PasswordInputWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const PasswordInput = styled(Input)`
  margin-right: 0.5rem;
`;

const IconButton = styled(Button)`
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  color: rgb(105, 0, 153) !important;
  margin-left: -2.5rem !important;
  cursor: pointer !important;
  box-shadow: none !important;
  height: auto !important;
  width: auto !important;
`;

const LoginButton = styled(Button)`
  background-color: rgb(134, 5, 240) !important;
  padding: 0.8rem !important;
  margin: 2.5rem 0 2.2rem 0 !important;
  width: 100% !important;
`;

const ErrorMessage = styled(Message)`
  margin-bottom: 1rem;
`;

const Footer = styled.footer`
  margin-top: auto;
  position: fixed;
  bottom: 0;
  padding: 0.5rem;
  color: white;

  @media (max-width: 768px) {
    position: static;
    color: #333;
    text-align: center;
    padding-top: 1rem;
  }
`;

const VersionBadge = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 0.5rem;

  @media (max-width: 768px) {
    color: rgba(100, 100, 100, 0.7);
  }
`;

// Componente Login

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loadUserProfile } = useUserProfile();

  const handleLogin = async () => {
    if (!email || !senha) {
      setErro('Preencha todos os campos');
      return;
    }

    try {
      // Conta ativa é por sessão de login: quem (re)loga precisa reinserir a UK.
      clearContaAtivaStorage();

      // 1) Login no Partners via BACKEND (evita CORS)
      const partnersResp = await fetch(`${API}/api/partners/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha }),
      });

      if (!partnersResp.ok) {
        const t = await partnersResp.text().catch(()=>'');
        setErro(`Falha no login do Partners — ${t.slice(0,200)}`);
        return;
      }

      const partnersData = await partnersResp.json(); // { ok, userName, partnersUK }
      if (!partnersData?.ok) {
        setErro('Login do Partners não retornou sucesso.');
        return;
      }

      if (partnersData.userName) localStorage.setItem('userName', partnersData.userName);
      if (partnersData.partnersUK) localStorage.setItem('partnersUK', partnersData.partnersUK);

      // 2) Emissão do JWT do N1 com o e-mail real (já validado no Partners)
      const resAuth = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }), // só precisa do email
      });

      if (!resAuth.ok) {
        setErro('Falha na autenticação interna.');
        return;
      }

      const authData = await resAuth.json();
      localStorage.setItem('token', authData.token);
      localStorage.setItem('userEmail', authData.email || email);

      // 3) Resolve perfil no sistema de permissões (aguarda antes de navegar
      //    para que isAdmin esteja disponível no redirecionamento de home)
      await loadUserProfile(authData.email || email, partnersData.userName);

      // 4) Vai para o app — HomeRedirect decide /copilot ou /services conforme perfil
      navigate('/home');
    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro ao tentar fazer login. Tente novamente mais tarde.');
    }
  };

  return (
    <Container>
      <LeftPanel>
        <LeftImg src={blackWhiteMove} alt="Logo" />
        <LeftTitle>N1 App</LeftTitle>
        <Subtitle>Utilize seu login do Partners para acessar nossa ferramenta do suporte</Subtitle>
        <Subtitle>Acesse nosso Notion com a documentação para garantir as boas práticas de uso da ferramenta</Subtitle>
        <Footer>© {new Date().getFullYear()} Ploomes • Developed by N1 Team <VersionBadge>{APP_VERSION}</VersionBadge></Footer>
      </LeftPanel>

      <RightPanel>
        <Card onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}>
          <RightTitle>Login</RightTitle>

          <InputGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu email"
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="senha">Senha</Label>
            <PasswordInputWrapper>
              <PasswordInput
                id="senha"
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="off"
              />
              <IconButton
                type="button"
                icon={showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'}
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar ou esconder senha"
              />
            </PasswordInputWrapper>
          </InputGroup>

          {erro && <ErrorMessage severity="error" text={erro} />}

          <LoginButton
            label="Entrar"
            icon="pi pi-sign-in"
            type="submit"
          />

          <Footer>© {new Date().getFullYear()} Ploomes • Developed by N1 Team <VersionBadge>{APP_VERSION}</VersionBadge></Footer>
        </Card>
      </RightPanel>
    </Container>
  );
}