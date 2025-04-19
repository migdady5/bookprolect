package com.BookProject.demo.controller;

import com.BookProject.demo.model.Appointment;
import com.BookProject.demo.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class AppointmentPageController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    // عرض صفحة كل المواعيد
    @GetMapping("/appointments")
    public String showAppointmentsPage(Model model) {
        model.addAttribute("appointments", appointmentRepository.findAll());
        return "appointments";
    }

    // عرض صفحة الفورم
    @GetMapping("/appointments/add")
    public String showAddForm(Model model) {
        model.addAttribute("appointment", new Appointment());
        return "add-appointment";
    }

    // معالجة الفورم
    @PostMapping("/appointments/add")
    public String handleFormSubmit(@ModelAttribute Appointment appointment, Model model) {
        System.out.println("📥 الاسم: " + appointment.getName());
        System.out.println("📅 التاريخ: " + appointment.getDate());
        System.out.println("⏰ الوقت: " + appointment.getTime());

        appointmentRepository.save(appointment);
        model.addAttribute("message", "تم الحجز بنجاح ✅");
        model.addAttribute("appointments", appointmentRepository.findAll());
        return "appointments";
    }
}

