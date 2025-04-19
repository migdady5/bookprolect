package com.BookProject.demo.controller;

import com.BookProject.demo.model.Appointment;
import com.BookProject.demo.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentApiController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    // إضافة موعد جديد (API)
    @PostMapping
    public Appointment createAppointment(@RequestBody Appointment appointment) {
        return appointmentRepository.save(appointment);
    }

    // عرض كل المواعيد (API)
    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
}
