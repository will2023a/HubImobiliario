const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main(){
  console.log('🌱 Seeding database...')
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@crm.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'super@crm.com',
      password: await bcrypt.hash('super123', 10),
      role: 'super_admin'
    }
  })
  console.log('✅ Super Admin:', superAdmin.email)

  const imob = await prisma.imobiliaria.create({
    data: {
      nome: 'Imobiliária Prime',
      cnpj: '12345678000190',
      email: 'contato@prime.com',
      telefone: '11999999999',
      status: 'ativa',
      plan: 'enterprise'
    }
  })
  console.log('✅ Imobiliária:', imob.nome)

  // Permissões padrão para visitas
  const visitasPermissions = [
    { role: 'diretor', recurso: 'visitas', acao: 'criar', permitido: true, imobiliariaId: null },
    { role: 'diretor', recurso: 'visitas', acao: 'ler', permitido: true, imobiliariaId: null },
    { role: 'diretor', recurso: 'visitas', acao: 'editar', permitido: true, imobiliariaId: null },
    { role: 'diretor', recurso: 'visitas', acao: 'deletar', permitido: true, imobiliariaId: null },
    { role: 'gerente', recurso: 'visitas', acao: 'criar', permitido: true, imobiliariaId: null },
    { role: 'gerente', recurso: 'visitas', acao: 'ler', permitido: true, imobiliariaId: null },
    { role: 'gerente', recurso: 'visitas', acao: 'editar', permitido: true, imobiliariaId: null },
    { role: 'gerente', recurso: 'visitas', acao: 'deletar', permitido: false, imobiliariaId: null },
    { role: 'corretor', recurso: 'visitas', acao: 'criar', permitido: true, imobiliariaId: null },
    { role: 'corretor', recurso: 'visitas', acao: 'ler', permitido: true, imobiliariaId: null },
    { role: 'corretor', recurso: 'visitas', acao: 'editar', permitido: false, imobiliariaId: null },
    { role: 'corretor', recurso: 'visitas', acao: 'deletar', permitido: false, imobiliariaId: null },
  ]

  // Permissões padrão para marketing
  const marketingPermissions = [
    { role: 'diretor', recurso: 'marketing', acao: 'criar', permitido: true, imobiliariaId: null },
    { role: 'diretor', recurso: 'marketing', acao: 'ler', permitido: true, imobiliariaId: null },
    { role: 'diretor', recurso: 'marketing', acao: 'editar', permitido: true, imobiliariaId: null },
    { role: 'diretor', recurso: 'marketing', acao: 'deletar', permitido: true, imobiliariaId: null },
    { role: 'gerente', recurso: 'marketing', acao: 'criar', permitido: true, imobiliariaId: null },
    { role: 'gerente', recurso: 'marketing', acao: 'ler', permitido: true, imobiliariaId: null },
    { role: 'gerente', recurso: 'marketing', acao: 'editar', permitido: true, imobiliariaId: null },
    { role: 'gerente', recurso: 'marketing', acao: 'deletar', permitido: false, imobiliariaId: null },
    { role: 'corretor', recurso: 'marketing', acao: 'criar', permitido: false, imobiliariaId: null },
    { role: 'corretor', recurso: 'marketing', acao: 'ler', permitido: true, imobiliariaId: null },
    { role: 'corretor', recurso: 'marketing', acao: 'editar', permitido: false, imobiliariaId: null },
    { role: 'corretor', recurso: 'marketing', acao: 'deletar', permitido: false, imobiliariaId: null },
  ]

  // Criar permissões (ignorar se já existirem)
  try {
    await prisma.permissao.createMany({
      data: [...visitasPermissions, ...marketingPermissions],
      skipDuplicates: true
    })
    console.log('✅ Permissões de visitas e marketing criadas')
  } catch (error) {
    console.log('⚠️  Permissões já existem ou erro:', error.message)
  }

  console.log('\n🎉 Seed OK! Login: super@crm.com / super123\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
