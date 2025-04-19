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

    // عرض كل المواعيد للمستخدم
    @GetMapping("/appointments")
    public String viewAppointmentsPage(Model model) {
        model.addAttribute("appointments", appointmentRepository.findAll());
        return "appointments";
    }

    // عرض صفحة إضافة موعد
    @GetMapping("/appointments/add")
    public String showAddForm(Model model) {
        model.addAttribute("appointment", new Appointment());
        return "add-appointment";
    }

    // حفظ الموعد بعد تعبئة الفورم
    @PostMapping("/appointments/add")
    public String handleFormSubmit(@ModelAttribute Appointment appointment, Model model) {
        appointmentRepository.save(appointment);
        model.addAttribute("message", "تم الحجز بنجاح ✅");
        model.addAttribute("appointments", appointmentRepository.findAll());
        return "appointments";
    }
}
