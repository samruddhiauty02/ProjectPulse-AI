
package com.projectpulse.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.projectpulse.entity.Project;
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // FIND PROJECTS BY STATUS
    List<Project> findByStatusIgnoreCase(String status);

    // SEARCH PROJECTS BY PROJECT NAME
    List<Project> findByProjectNameContainingIgnoreCase(String projectName);

    // FIND PROJECTS ENDING WITHIN A DATE RANGE
    List<Project> findByEndDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(p.budget), 0) FROM Project p")
BigDecimal getTotalBudget();

// GET AVERAGE PROJECT BUDGET
@Query("SELECT COALESCE(AVG(p.budget), 0) FROM Project p")
Double getAverageBudget();

// GET HIGHEST PROJECT BUDGET
@Query("SELECT COALESCE(MAX(p.budget), 0) FROM Project p")
BigDecimal getHighestBudget();

@Query("SELECT p.status, COUNT(p) FROM Project p GROUP BY p.status")
List<Object[]> getProjectCountByStatus();
// FIND OVERDUE PROJECTS
List<Project> findByEndDateBeforeAndStatusNotIgnoreCase(
        LocalDate date,
        String status
);

}