package com.logitrack;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerarHashBCrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String password = "admin123";
        String hash = encoder.encode(password);

        System.out.println("=========================================");
        System.out.println("NUEVO HASH BCRYPT GENERADO");
        System.out.println("=========================================");
        System.out.println("Contraseña: " + password);
        System.out.println("Hash: " + hash);
        System.out.println();
        System.out.println("Copia este comando SQL:");
        System.out.println("=========================================");
        System.out.println("UPDATE usuario SET password = '" + hash + "' WHERE username = 'admin';");
        System.out.println("=========================================");
    }
}
