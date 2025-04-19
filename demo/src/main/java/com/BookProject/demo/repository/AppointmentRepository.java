package com.BookProject.demo.repository;

import com.BookProject.demo.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    // ممكن نضيف دوال مخصصة هنا لاحقاً
}
