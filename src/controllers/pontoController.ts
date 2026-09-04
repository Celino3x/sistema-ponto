import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import soap from 'soap';

const prisma = new PrismaClient();

// ===================== INTEGRAÇÃO SOFTEXPERT =====================
async function enviarParaSoftExpert(anexoBase64: string, nomeArquivo: string, tituloDoc: string) {
  try {
    const url = process.env.SE_URL as string;
    const seUser = process.env.SE_USER as string;
    const sePassword = process.env.SE_PASSWORD as string;

    if (!url || !seUser || !sePassword) {
      throw new Error('Credenciais do SoftExpert não configuradas no .env');
    }

    const cleanBase64 = anexoBase64.split(',')[1] || anexoBase64;

    const args = {
      IDCATEGORY: process.env.SE_CATEGORY as string,
      IDDOCUMENT: '',
      TITLE: tituloDoc,
      DSRESUME: 'Documento gerado automaticamente pelo sistema de ponto.',
      DTDOCUMENT: new Date().toISOString().split('T')[0],
      ATTRIBUTES: '',
      IDUSER: seUser, // Usuário responsável
      PARTICIPANTS: '',
      FGMODEL: '1',
      FILE: {
        NMFILE: nomeArquivo,
        BINFILE: cleanBase64
      },
      KEYWORD: ''
    };

    // 1. Cria o cliente SOAP
    const client = await soap.createClientAsync(url, {});

    // 2. Configura a autenticação WS-Security (Password Text) [citation:2]
    client.setSecurity(new soap.WSSecurity(seUser, sePassword));

    const result = await client.newDocumentAsync(args);
    console.log('✅ SoftExpert Response:', JSON.stringify(result));
    return result;

  } catch (error: any) {
    console.error('❌ Erro ao integrar com SoftExpert:', error);
    return { success: false, message: 'Falha na integração com SoftExpert' };
  }
}
// ================================================================

// Bater o ponto (Entrada ou Saída)
export const registrarPonto = async (req: Request, res: Response) => {
  try {
    const colaboradorId = req.userId;
    const agora = new Date();

    const pontoAberto = await prisma.ponto.findFirst({
      where: { colaboradorId, saida: null },
    });

    if (!pontoAberto) {
      const ponto = await prisma.ponto.create({
        data: { colaboradorId, entrada: agora },
      });
      return res.status(201).json({ message: 'Entrada registrada!', ponto });
    } else {
      const horasTrabalhadas = (agora.getTime() - pontoAberto.entrada.getTime()) / (1000 * 60 * 60);
      
      const ponto = await prisma.ponto.update({
        where: { id: pontoAberto.id },
        data: { saida: agora, horasTrabalhadas },
      });
      return res.json({ message: 'Saída registrada!', ponto });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao registrar ponto' });
  }
};

// Listar o histórico do colaborador logado
export const listarHistorico = async (req: Request, res: Response) => {
  try {
    const colaboradorId = req.userId;
    
    const pontos = await prisma.ponto.findMany({
      where: { colaboradorId },
      orderBy: { entrada: 'desc' }
    });

    return res.json(pontos);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar histórico' });
  }
};

// Solicitar correção de ponto
export const solicitarCorrecao = async (req: Request, res: Response) => {
  try {
    const colaboradorId = req.userId;
    const { pontoId, motivo, novaHora, tipo } = req.body;

    const tipoCorrecao = tipo || 'entrada';

    const solicitacao = await prisma.solicitacaoCorrecao.create({
      data: {
        colaboradorId,
        pontoId,
        motivo,
        novaHora: new Date(novaHora),
        tipo: tipoCorrecao,
      },
    });

    return res.status(201).json({ message: 'Solicitação enviada!', solicitacao });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao solicitar correção' });
  }
};

// Solicitar justificativa ou abono de falta
export const solicitarJustificativa = async (req: Request, res: Response) => {
  try {
    const colaboradorId = req.userId;
    const { dataFalta, motivo, anexoUrl, nomeArquivo } = req.body;

    // 1. Salva no banco de dados
    const justificativa = await prisma.justificativaAbono.create({
      data: {
        colaboradorId,
        dataFalta: new Date(dataFalta),
        motivo,
        anexoUrl: anexoUrl || null,
      },
    });

    // 2. Envia para o SoftExpert se houver anexo
    if (anexoUrl && typeof anexoUrl === 'string') { 
      const tituloDoc = `Justificativa - ID: ${justificativa.id} - Colaborador ${colaboradorId}`;
      // Usa nomeArquivo se for string, senão define um padrão
      const nomeFinal = typeof nomeArquivo === 'string' ? nomeArquivo : 'justificativa.pdf';
      await enviarParaSoftExpert(anexoUrl, nomeFinal, tituloDoc);
    }

    return res.status(201).json({ message: 'Justificativa enviada!', justificativa });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao solicitar justificativa' });
  }
};