package com.BookProject.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);

		// 👇 شيفرة طباعة باسورد مشفر:
		String rawPassword = "123456";
		String encoded = new BCryptPasswordEncoder().encode(rawPassword);
		System.out.println("🔐 الباسورد المشفر: " + encoded);
	}
}
