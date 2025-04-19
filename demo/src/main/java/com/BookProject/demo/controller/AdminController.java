package com.BookProject.demo.controller;

import com.BookProject.demo.model.Appointment;
import com.BookProject.demo.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class AdminController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    // عرض صفحة المواعيد الخاصة بالأدمن
    @GetMapping("/admin/appointments")
    public String viewAdminAppointments(Model model) {
        model.addAttribute("appointments", appointmentRepository.findAll());
        return "admin-appointments";
    }

    // تحديث الملاحظات
    @PostMapping("/admin/appointments/{id}/notes")
    public String updateNotes(@PathVariable Long id, @RequestParam String notes) {
        Appointment appointment = appointmentRepository.findById(id).orElse(null);
        if (appointment != null) {
            appointment.setNotes(notes);
            appointmentRepository.save(appointment);
        }
        return "redirect:/admin/appointments";
    }

    // حذف موعد
    @PostMapping("/admin/appointments/{id}/delete")
    public String deleteAppointment(@PathVariable Long id) {
        appointmentRepository.deleteById(id);
        return "redirect:/admin/appointments";
    }
}
