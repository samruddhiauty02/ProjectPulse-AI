
package com.projectpulse.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.projectpulse.entity.Project;
import com.projectpulse.service.ProjectService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    // CREATE PROJECT
    @PostMapping
    public Project createProject(@Valid @RequestBody Project project) {
        return projectService.saveProject(project);
    }

    // GET ALL PROJECTS
    @GetMapping
    public List<Project> getAllProjects() {
        return projectService.getAllProjects();
    }

    // GET PROJECT BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // UPDATE PROJECT
    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody Project project) {

        return projectService.getProjectById(id)
                .map(existingProject -> {
                    project.setId(id);
                    return ResponseEntity.ok(
                            projectService.saveProject(project)
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE PROJECT
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {

        if (projectService.getProjectById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        projectService.deleteProject(id);

        return ResponseEntity.noContent().build();
    }

    // GET TOTAL PROJECT COUNT
    @GetMapping("/count")
    public long getProjectCount() {
        return projectService.getTotalProjects();
    }

    // FILTER PROJECTS BY STATUS
    @GetMapping("/status/{status}")
    public List<Project> getProjectsByStatus(@PathVariable String status) {
        return projectService.getProjectsByStatus(status);
    }

    // SEARCH PROJECTS BY NAME
    @GetMapping("/search")
    public List<Project> searchProjectsByName(
            @RequestParam String name) {
        return projectService.searchProjectsByName(name);
    }

    // GET TOTAL BUDGET OF ALL PROJECTS
    @GetMapping("/total-budget")
    public BigDecimal getTotalBudget() {
        return projectService.getTotalBudget();
    }

    // GET AVERAGE PROJECT BUDGET
    @GetMapping("/average-budget")
    public Double getAverageBudget() {
        return projectService.getAverageBudget();
    }

    // GET HIGHEST PROJECT BUDGET
    @GetMapping("/highest-budget")
    public BigDecimal getHighestBudget() {
        return projectService.getHighestBudget();
    }

    // GET PROJECT COUNT BY STATUS
    @GetMapping("/status-summary")
    public List<Map<String, Object>> getProjectCountByStatus() {
        return projectService.getProjectCountByStatus();
    }

    // GET PROJECTS WITH UPCOMING DEADLINES
    @GetMapping("/upcoming-deadlines")
    public List<Project> getUpcomingDeadlines() {
        return projectService.getUpcomingDeadlines();
    }

    // GET OVERDUE PROJECTS
    @GetMapping("/overdue")
    public List<Project> getOverdueProjects() {
        return projectService.getOverdueProjects();
    }

    // GET PROJECT PROGRESS SUMMARY
    @GetMapping("/progress-summary")
    public Map<String, Long> getProjectProgressSummary() {
        return projectService.getProjectProgressSummary();
    }

    // GET PROJECT-WISE PROCUREMENT AND BUDGET SUMMARY
    @GetMapping("/{id}/procurement-summary")
    public Map<String, Object> getProjectProcurementSummary(
            @PathVariable Long id) {
        return projectService.getProjectProcurementSummary(id);
    }
}
