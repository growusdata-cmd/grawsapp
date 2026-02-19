
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a standard font if needed
// Font.register({ family: 'Inter', src: 'https://rsms.me/inter/font-files/Inter-Regular.woff2' });

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        color: '#333',
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: '1pt solid #eee',
        paddingBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    statusBadge: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        padding: '4 8',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 'bold',
        width: 60,
        textAlign: 'center',
        marginTop: 10,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 15,
    },
    infoItem: {
        width: '50%',
        marginBottom: 8,
    },
    label: {
        color: '#666',
        fontSize: 8,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    divider: {
        borderBottom: '1pt solid #eee',
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 15,
        backgroundColor: '#f9fafb',
        padding: 8,
        borderLeft: '4pt solid #2563eb',
    },
    responseRow: {
        marginBottom: 12,
        paddingLeft: 10,
    },
    fieldLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#4b5563',
    },
    fieldValue: {
        fontSize: 10,
        lineHeight: 1.4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTop: '1pt solid #eee',
        paddingTop: 10,
        color: '#9ca3af',
        fontSize: 8,
    }
});

interface InspectionPDFProps {
    inspection: any;
}

export const InspectionPDF: React.FC<InspectionPDFProps> = ({ inspection }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{inspection.assignment.project.company.name}</Text>
                <Text style={styles.subtitle}>{inspection.assignment.project.name}</Text>
                <Text style={{ fontSize: 18, color: '#9ca3af', marginVertical: 5 }}>INSPECTION REPORT</Text>

                <View style={styles.statusBadge}>
                    <Text>APPROVED</Text>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>Report ID</Text>
                        <Text style={styles.value}>INS-{inspection.id.substring(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>Inspector</Text>
                        <Text style={styles.value}>{inspection.submitter.name}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>Inspection Date</Text>
                        <Text style={styles.value}>
                            {inspection.submittedAt ? new Date(inspection.submittedAt).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.label}>Approval Date</Text>
                        <Text style={styles.value}>
                            {inspection.approvedAt ? new Date(inspection.approvedAt).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Responses */}
            <Text style={styles.sectionTitle}>Inspection Details</Text>

            <View>
                {inspection.responses.sort((a: any, b: any) => a.field.displayOrder - b.field.displayOrder).map((resp: any) => (
                    <View key={resp.id} style={styles.responseRow} wrap={false}>
                        <Text style={styles.fieldLabel}>{resp.field.fieldLabel}</Text>
                        <Text style={styles.fieldValue}>
                            {resp.field.fieldType === 'file'
                                ? '(File attached in digital portal)'
                                : resp.field.fieldType === 'checkbox'
                                    ? (resp.value === 'true' ? 'Yes' : 'No')
                                    : resp.value || 'Not recorded'}
                        </Text>
                        <View style={{ borderBottom: '0.5pt solid #f3f4f6', marginTop: 10 }} />
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
                <Text>{inspection.assignment.project.company.name}</Text>
                <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
                <Text>Confidential Report</Text>
            </View>
        </Page>
    </Document>
);
