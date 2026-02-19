
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    const users = [
        {
            email: 'admin@cims.com',
            name: 'Admin User',
            password,
            role: 'ADMIN',
        },
        {
            email: 'manager@cims.com',
            name: 'Manager User',
            password,
            role: 'MANAGER',
        },
        {
            email: 'inspector@cims.com',
            name: 'Inspection Boy',
            password,
            role: 'INSPECTION_BOY',
        },
        {
            email: 'client@cims.com',
            name: 'Client User',
            password,
            role: 'CLIENT',
        },
    ]

    for (const user of users) {
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
        })

        if (!existingUser) {
            const newUser = await prisma.user.create({
                data: user,
            })
            console.log(`Created user: ${user.email}`)

            // Create demo data for Admin
            if (user.role === 'ADMIN') {
                const company = await prisma.company.create({
                    data: {
                        name: 'Demo Company',
                        address: '123 Tech Park',
                        contactPerson: 'John Admin',
                        contactPhone: '1234567890',
                        createdBy: newUser.id,
                    }
                })

                await prisma.project.create({
                    data: {
                        name: 'Safety Audit 2024',
                        description: 'Annual safety inspection project',
                        companyId: company.id,
                        createdBy: newUser.id,
                    }
                })
                console.log('Created demo company and project')
            }

            // Create client portal data
            if (user.email === 'client@cims.com') {
                const clientCompany = await prisma.company.create({
                    data: {
                        name: 'Test Client Company',
                        address: '789 Client Ave',
                        contactPerson: 'Alice Client',
                        contactPhone: '9988776655',
                        createdBy: newUser.id,
                    }
                })

                // Link the client user to this company
                await prisma.user.update({
                    where: { id: newUser.id },
                    data: { companyId: clientCompany.id }
                })

                const project = await prisma.project.create({
                    data: {
                        name: 'Main Factory Inspection',
                        description: 'Monthly facility checks',
                        companyId: clientCompany.id,
                        createdBy: newUser.id,
                    }
                })

                // Add form templates for this project
                await prisma.formTemplate.createMany({
                    data: [
                        { projectId: project.id, fieldLabel: 'Overall Safety', fieldType: 'dropdown', options: 'Excellent,Good,Average,Poor', isRequired: true, displayOrder: 1 },
                        { projectId: project.id, fieldLabel: 'Inspection Date', fieldType: 'date', isRequired: true, displayOrder: 2 },
                        { projectId: project.id, fieldLabel: 'Notes', fieldType: 'textarea', isRequired: false, displayOrder: 3 }
                    ]
                })

                const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
                const inspector = await prisma.user.findFirst({ where: { role: 'INSPECTION_BOY' } })

                if (admin && inspector) {
                    const assignment = await prisma.assignment.create({
                        data: {
                            projectId: project.id,
                            inspectionBoyId: inspector.id,
                            assignedBy: admin.id,
                            status: 'completed'
                        }
                    })

                    const inspection = await prisma.inspection.create({
                        data: {
                            assignmentId: assignment.id,
                            submittedBy: inspector.id,
                            status: 'approved',
                            submittedAt: new Date(Date.now() - 86400000), // yesterday
                            approvedAt: new Date(),
                            reviewerNotes: 'Everything looks great. Maintenance is up to date.'
                        }
                    })

                    const templates = await prisma.formTemplate.findMany({ where: { projectId: project.id } })

                    for (const template of templates) {
                        let value = ''
                        if (template.fieldLabel === 'Overall Safety') value = 'Excellent'
                        if (template.fieldLabel === 'Inspection Date') value = new Date().toISOString().split('T')[0]
                        if (template.fieldLabel === 'Notes') value = 'Facility is in top condition. No leaks found.'

                        await prisma.inspectionData.create({
                            data: {
                                inspectionId: inspection.id,
                                fieldId: template.id,
                                value
                            }
                        })
                    }
                }
                console.log('Created test client company, user, and approved inspection')
            }
        } else {
            console.log(`User already exists: ${user.email}`)
        }

    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
