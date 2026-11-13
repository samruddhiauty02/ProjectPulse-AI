
package com.projectpulse.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.projectpulse.entity.Project;
import com.projectpulse.repository.ProcurementRepository;
import com.projectpulse.repository.ProjectRepository;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProcurementRepository procurementRepository;

    public ProjectService(
            ProjectRepository projectRepository,
            ProcurementRepository procurementRepository) {
        this.projectRepository = projectRepository;
        this.procurementRepository = procurementRepository;
    }

    // CREATE PROJECT
    public Project saveProject(Project project) {
        return projectRepository.save(project);
    }

    // GET ALL PROJECTS
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    // GET PROJECT BY ID
    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    // DELETE PROJECT
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    // GET TOTAL PROJECT COUNT
    public long getTotalProjects() {
        return projectRepository.count();
    }

    // FILTER PROJECTS BY STATUS
    public List<Project> getProjectsByStatus(String status) {
        return projectRepository.findByStatusIgnoreCase(status);
    }

    // SEARCH PROJECTS BY NAME
    public List<Project> searchProjectsByName(String projectName) {
        return projectRepository.findByProjectNameContainingIgnoreCase(
                projectName);
    }

    // GET TOTAL BUDGET OF ALL PROJECTS
    public BigDecimal getTotalBudget() {
        return projectRepository.getTotalBudget();
    }

    // GET AVERAGE PROJECT BUDGET
    public Double getAverageBudget() {
        return projectRepository.getAverageBudget();
    }

    // GET HIGHEST PROJECT BUDGET
    public BigDecimal getHighestBudget() {
        return projectRepository.getHighestBudget();
    }

    // GET PROJECT COUNT BY STATUS
    public List<Map<String, Object>> getProjectCountByStatus() {

        List<Object[]> results =
                projectRepository.getProjectCountByStatus();

        List<Map<String, Object>> response = new ArrayList<>();

        for (Object[] result : results) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("status", result[0]);
            map.put("count", result[1]);
            response.add(map);
        }

        return response;
    }

    // GET PROJECTS WITH UPCOMING DEADLINES
    public List<Project> getUpcomingDeadlines() {

        LocalDate today = LocalDate.now();
        LocalDate next30Days = today.plusDays(30);

        return projectRepository.findByEndDateBetween(
                today,
                next30Days
        );
    }

    // GET OVERDUE PROJECTS
    public List<Project> getOverdueProjects() {

        LocalDate today = LocalDate.now();

        return projectRepository.findByEndDateBeforeAndStatusNotIgnoreCase(
                today,
                "COMPLETED"
        );
    }

    // GET PROJECT PROGRESS SUMMARY
    public Map<String, Long> getProjectProgressSummary() {

        Map<String, Long> summary = new LinkedHashMap<>();

        summary.put("totalProjects", projectRepository.count());

        summary.put("inProgressProjects",
                (long) projectRepository.findByStatusIgnoreCase(
                        "IN_PROGRESS").size());

        summary.put("completedProjects",
                (long) projectRepository.findByStatusIgnoreCase(
                        "COMPLETED").size());

        summary.put("plannedProjects",
                (long) projectRepository.findByStatusIgnoreCase(
                        "PLANNED").size());

        summary.put("overdueProjects",
                (long) getOverdueProjects().size());

        return summary;
    }

    // CALCULATE PERCENTAGE SAFELY
    private BigDecimal calculatePercentage(
            BigDecimal amount,
            BigDecimal budget) {

        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return amount
                .multiply(BigDecimal.valueOf(100))
                .divide(budget, 2, RoundingMode.HALF_UP);
    }

    // GET PROJECT-WISE PROCUREMENT AND BUDGET SUMMARY
    public Map<String, Object> getProjectProcurementSummary(Long projectId) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Project not found with ID: " + projectId
                ));

        BigDecimal budget = project.getBudget();

        // TOTAL REQUESTED AMOUNT: ALL PROCUREMENT STATUSES
        BigDecimal totalRequested =
                procurementRepository.getTotalProcurementAmountByProjectId(
                        projectId);

        // STATUS-WISE PROCUREMENT AMOUNTS
        BigDecimal pending =
                procurementRepository.getTotalAmountByProjectAndStatus(
                        projectId, "PENDING");

        BigDecimal approved =
                procurementRepository.getTotalAmountByProjectAndStatus(
                        projectId, "APPROVED");

        BigDecimal paid =
                procurementRepository.getTotalAmountByProjectAndStatus(
                        projectId, "PAID");

        BigDecimal rejected =
                procurementRepository.getTotalAmountByProjectAndStatus(
                        projectId, "REJECTED");

        // AMOUNTS NOT MATCHING THE FOUR KNOWN STATUSES
        BigDecimal unclassified = totalRequested
                .subtract(pending)
                .subtract(approved)
                .subtract(paid)
                .subtract(rejected);

        // APPROVED + PAID = COMMITTED BUDGET
        BigDecimal committed = approved.add(paid);

        // PAID AMOUNT = ACTUAL EXPENSE
        BigDecimal actualSpent = paid;

        // AVAILABLE BUDGET AFTER APPROVED AND PAID AMOUNTS
        BigDecimal remainingBudget = budget.subtract(committed);

        // BUDGET UTILIZATION
        BigDecimal committedUtilization =
                calculatePercentage(committed, budget);

        BigDecimal actualSpendUtilization =
                calculatePercentage(actualSpent, budget);

        // BUILD RESPONSE
        Map<String, Object> summary = new LinkedHashMap<>();

        summary.put("projectId", project.getId());
        summary.put("projectName", project.getProjectName());
        summary.put("projectBudget", budget);

        // FINANCIAL BREAKDOWN
        summary.put("totalRequestedProcurementAmount", totalRequested);
        summary.put("pendingProcurementAmount", pending);
        summary.put("approvedProcurementAmount", approved);
        summary.put("paidProcurementAmount", paid);
        summary.put("rejectedProcurementAmount", rejected);
        summary.put("unclassifiedProcurementAmount", unclassified);

        // COMMITMENTS AND ACTUAL SPENDING
        summary.put("committedAmount", committed);
        summary.put("actualSpentAmount", actualSpent);

        // BACKWARD-COMPATIBLE FIELDS
        summary.put("totalProcurementAmount", actualSpent);
        summary.put("remainingBudget", remainingBudget);
        summary.put("budgetUtilizationPercentage",
                committedUtilization);

        // ADDITIONAL UTILIZATION METRICS
        summary.put("committedBudgetUtilizationPercentage",
                committedUtilization);

        summary.put("actualSpendUtilizationPercentage",
                actualSpendUtilization);

        // LINKED PROCUREMENT RECORDS
        summary.put("procurements",
                procurementRepository.findByProject_Id(projectId));

        return summary;
    }
}
