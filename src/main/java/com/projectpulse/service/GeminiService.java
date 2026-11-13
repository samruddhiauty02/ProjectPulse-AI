
package com.projectpulse.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.projectpulse.entity.Procurement;
import com.projectpulse.entity.Project;

@Service
public class GeminiService {

    private static final Logger logger =
            LoggerFactory.getLogger(GeminiService.class);

    private final Client geminiClient;
    private final ProjectService projectService;
    private final ProcurementService procurementService;

    public GeminiService(
            Client geminiClient,
            ProjectService projectService,
            ProcurementService procurementService) {

        this.geminiClient = geminiClient;
        this.projectService = projectService;
        this.procurementService = procurementService;
    }

    public String generateResponse(String question) {

        logger.info("Collecting ProjectPulse AI database information...");

        StringBuilder context = new StringBuilder();

        // ==========================================
        // PROJECT DATABASE INFORMATION
        // ==========================================

        List<Project> projects = projectService.getAllProjects();

        context.append("\nPROJECT DATABASE INFORMATION\n");

        context.append("Total Projects: ")
                .append(projects.size())
                .append("\n\n");

        for (Project project : projects) {

            context.append("Project ID: ")
                    .append(project.getId()).append("\n");

            context.append("Project Name: ")
                    .append(project.getProjectName()).append("\n");

            context.append("Description: ")
                    .append(project.getDescription()).append("\n");

            context.append("Allocated Project Budget: ")
                    .append(project.getBudget()).append("\n");

            context.append("Project Status: ")
                    .append(project.getStatus()).append("\n");

            context.append("Start Date: ")
                    .append(project.getStartDate()).append("\n");

            context.append("End Date: ")
                    .append(project.getEndDate()).append("\n");

            // PROJECT-WISE FINANCIAL SUMMARY

            Map<String, Object> summary =
                    projectService.getProjectProcurementSummary(
                            project.getId()
                    );

            context.append("\nPROJECT FINANCIAL SUMMARY\n");

            context.append("Total Requested Procurement Amount: ")
                    .append(summary.get("totalRequestedProcurementAmount"))
                    .append("\n");

            context.append("Pending Procurement Amount: ")
                    .append(summary.get("pendingProcurementAmount"))
                    .append("\n");

            context.append("Approved Procurement Amount: ")
                    .append(summary.get("approvedProcurementAmount"))
                    .append("\n");

            context.append("Paid Procurement Amount: ")
                    .append(summary.get("paidProcurementAmount"))
                    .append("\n");

            context.append("Rejected Procurement Amount: ")
                    .append(summary.get("rejectedProcurementAmount"))
                    .append("\n");

            context.append("Unclassified Procurement Amount: ")
                    .append(summary.get("unclassifiedProcurementAmount"))
                    .append("\n");

            context.append("Total Committed Amount: ")
                    .append(summary.get("committedAmount"))
                    .append("\n");

            context.append("Actual Amount Spent: ")
                    .append(summary.get("actualSpentAmount"))
                    .append("\n");

            context.append("Remaining Available Budget: ")
                    .append(summary.get("remainingBudget"))
                    .append("\n");

            context.append("Committed Budget Utilization: ")
                    .append(summary.get("committedBudgetUtilizationPercentage"))
                    .append("%\n");

            context.append("Actual Spending Utilization: ")
                    .append(summary.get("actualSpendUtilizationPercentage"))
                    .append("%\n");

            // PROJECT-WISE PROCUREMENT STATUS

            context.append("\nPROJECT PROCUREMENT STATUS DETAILS\n");

            context.append("Pending Procurement: ")
                    .append(procurementService.getAmountByProjectAndStatus(
                            project.getId(), "PENDING"))
                    .append("\n");

            context.append("Approved Procurement: ")
                    .append(procurementService.getAmountByProjectAndStatus(
                            project.getId(), "APPROVED"))
                    .append("\n");

            context.append("Paid Procurement: ")
                    .append(procurementService.getAmountByProjectAndStatus(
                            project.getId(), "PAID"))
                    .append("\n");

            context.append("Rejected Procurement: ")
                    .append(procurementService.getAmountByProjectAndStatus(
                            project.getId(), "REJECTED"))
                    .append("\n");

            context.append("--------------------------------\n");
        }

        // ==========================================
        // PROCUREMENT DATABASE INFORMATION
        // ==========================================

        List<Procurement> procurements =
                procurementService.getAllProcurements();

        context.append("\nPROCUREMENT DATABASE INFORMATION\n");

        context.append("Total Procurement Records: ")
                .append(procurements.size())
                .append("\n\n");

        for (Procurement procurement : procurements) {

            context.append("Procurement ID: ")
                    .append(procurement.getId()).append("\n");

            context.append("Title: ")
                    .append(procurement.getTitle()).append("\n");

            context.append("Vendor: ")
                    .append(procurement.getVendorName()).append("\n");

            context.append("Amount: ")
                    .append(procurement.getAmount()).append("\n");

            context.append("Status: ")
                    .append(procurement.getStatus()).append("\n");

            context.append("Request Date: ")
                    .append(procurement.getRequestDate()).append("\n");

            context.append("Description: ")
                    .append(procurement.getDescription()).append("\n");

            context.append("Linked Project: ");

            if (procurement.getProject() != null) {

                context.append(
                        procurement.getProject().getProjectName()
                );

                context.append(" (Project ID: ")
                        .append(procurement.getProject().getId())
                        .append(")");

            } else {

                context.append("Not linked to any project");
            }

            context.append("\n--------------------------------\n");
        }

        // ==========================================
        // PORTFOLIO-WIDE FINANCIAL SUMMARY
        // ==========================================

        Map<String, Object> financialSummary =
                procurementService.getFinancialSummary();

        context.append("\nPORTFOLIO PROCUREMENT FINANCIAL SUMMARY\n");

        for (Map.Entry<String, Object> entry :
                financialSummary.entrySet()) {

            context.append(entry.getKey())
                    .append(": ")
                    .append(entry.getValue())
                    .append("\n");
        }

        // ==========================================
        // PROCUREMENT STATUS BREAKDOWN
        // ==========================================

        context.append("\nACTUAL PROCUREMENT STATUS BREAKDOWN\n");

        context.append(
                procurementService.getProcurementStatusBreakdown()
        );

        // ==========================================
        // GEMINI AI INSTRUCTIONS
        // ==========================================

        String prompt = """
                You are ProjectPulse AI, an intelligent enterprise
                project management and procurement intelligence assistant.

                Your purpose is to help users understand project performance,
                procurement activities, budgets and financial information.

                Use the actual ProjectPulse AI database information
                provided below when answering questions about the system.

                ==========================================
                IMPORTANT FINANCIAL DEFINITIONS
                ==========================================

                1. TOTAL REQUESTED PROCUREMENT:
                   The sum of all procurement requests, regardless
                   of their current status.

                2. PENDING PROCUREMENT:
                   Requests awaiting approval.
                   These are NOT paid expenses and are NOT approved
                   financial commitments.

                3. APPROVED PROCUREMENT:
                   Requests that have been approved but are not
                   necessarily paid.

                4. PAID PROCUREMENT:
                   Requests representing completed payments.
                   These count as actual expenditure.

                5. REJECTED PROCUREMENT:
                   Rejected requests.
                   These must not be counted as approved commitments
                   or actual paid expenditure.

                6. TOTAL COMMITTED AMOUNT:
                   Approved procurement amount plus paid procurement
                   amount.
                   Do not include pending or rejected requests.

                7. ACTUAL AMOUNT SPENT:
                   Only the amount belonging to PAID procurement records.

                8. REMAINING AVAILABLE BUDGET:
                   Allocated project budget minus total committed amount.

                9. COMMITTED BUDGET UTILIZATION:
                   Total committed amount divided by allocated budget,
                   multiplied by 100.

                10. ACTUAL SPENDING UTILIZATION:
                    Actual paid amount divided by allocated budget,
                    multiplied by 100.

                ==========================================
                IMPORTANT ANSWERING RULES
                ==========================================

                1. Always use actual database records for project
                   and procurement questions.

                2. Clearly distinguish total requested amounts,
                   pending requests, approved commitments,
                   paid expenses and rejected requests.

                3. Never describe pending procurement as money spent.

                4. Never describe approved procurement as paid
                   unless its status is PAID.

                5. Calculate remaining budget using committed
                   procurement, not pending requests.

                6. Do not count rejected procurement as spending
                   or commitments.

                7. Total portfolio procurement includes all records,
                   including records that are not linked to projects.

                8. Project-wise financial summaries include only
                   procurement records linked to that particular project.

                9. Never assign an unlinked procurement record
                   to a project without database evidence.

                10. When portfolio totals differ from the sum of
                    project-wise totals, check whether unlinked
                    procurement records explain the difference.

                11. Do not invent project names, vendors, amounts,
                    statuses, dates or financial figures.

                12. Do not invent currency symbols.
                    The database does not currently specify a currency.

                13. If information is unavailable, clearly say so.

                14. Show financial calculations and percentages
                    clearly when relevant.

                15. Distinguish database facts from general
                    recommendations or business advice.

                16. Use clear headings, readable formatting and
                    concise explanations.

                17. If the user asks for all projects, include every
                    project available in the supplied database context.

                ==========================================
                ACTUAL PROJECTPULSE AI DATABASE INFORMATION
                ==========================================

                """ + context + """

                ==========================================
                USER QUESTION
                ==========================================

                """ + question;

        logger.info("Sending updated financial context to Gemini...");

        GenerateContentResponse response =
                geminiClient.models.generateContent(
                        "gemini-3.5-flash",
                        prompt,
                        null
                );

        logger.info("Gemini API response received successfully.");

        return response.text();
    }
}
