#!/usr/bin/env python3
import os
import json

CURRICULUM = {
    "parts": [
        {
            "order": 1,
            "title": "Foundations",
            "description": "Core principles & the GoF object-oriented patterns",
            "principles": [
                {"name": "SRP — Single Responsibility", "slug": "srp-single-responsibility"},
                {"name": "OCP — Open/Closed", "slug": "ocp-openclosed"},
                {"name": "LSP — Liskov Substitution", "slug": "lsp-liskov-substitution"},
                {"name": "ISP — Interface Segregation", "slug": "isp-interface-segregation"},
                {"name": "DIP — Dependency Inversion", "slug": "dip-dependency-inversion"},
                {"name": "DRY — Don't Repeat Yourself", "slug": "dry-dont-repeat-yourself"},
                {"name": "KISS — Keep It Simple", "slug": "kiss-keep-it-simple"},
                {"name": "YAGNI", "slug": "yagni"},
                {"name": "CQS — Command Query Separation", "slug": "cqs-command-query-separation"},
                {"name": "Information Hiding", "slug": "information-hiding"},
                {"name": "Encapsulation", "slug": "encapsulation"},
                {"name": "High Cohesion", "slug": "high-cohesion"},
                {"name": "Low Coupling", "slug": "low-coupling"},
                {"name": "Composition over Inheritance", "slug": "composition-over-inheritance"},
                {"name": "Law of Demeter", "slug": "law-of-demeter"},
                {"name": "Separation of Concerns", "slug": "separation-of-concerns"},
                {"name": "Single Source of Truth", "slug": "single-source-of-truth"},
                {"name": "Fail Fast", "slug": "fail-fast"},
                {"name": "Least Astonishment", "slug": "least-astonishment"},
                {"name": "Explicit over Implicit", "slug": "explicit-over-implicit"},
                {"name": "Tell Dont Ask", "slug": "tell-dont-ask"},
                {"name": "Program to an Interface", "slug": "program-to-an-interface"}
            ],
            "patterns": [
                {"name": "Factory Method", "slug": "factory-method"},
                {"name": "Abstract Factory", "slug": "abstract-factory"},
                {"name": "Builder", "slug": "builder"},
                {"name": "Prototype", "slug": "prototype"},
                {"name": "Singleton", "slug": "singleton"},
                {"name": "Static Factory Method", "slug": "static-factory-method"},
                {"name": "Adapter", "slug": "adapter"},
                {"name": "Bridge", "slug": "bridge"},
                {"name": "Composite", "slug": "composite"},
                {"name": "Decorator", "slug": "decorator"},
                {"name": "Facade", "slug": "facade"},
                {"name": "Flyweight", "slug": "flyweight"},
                {"name": "Proxy", "slug": "proxy"},
                {"name": "Chain of Responsibility", "slug": "chain-of-responsibility"},
                {"name": "Command", "slug": "command"},
                {"name": "Interpreter", "slug": "interpreter"},
                {"name": "Iterator", "slug": "iterator"},
                {"name": "Mediator", "slug": "mediator"},
                {"name": "Memento", "slug": "memento"},
                {"name": "Observer", "slug": "observer"},
                {"name": "State", "slug": "state"},
                {"name": "Strategy", "slug": "strategy"},
                {"name": "Template Method", "slug": "template-method"},
                {"name": "Visitor", "slug": "visitor"},
                {"name": "Null Object", "slug": "null-object"},
                {"name": "Value Object", "slug": "value-object"}
            ]
        }
    ]
}

print(f"Curriculum has {len(CURRICULUM['parts'])} part(s)")
for part in CURRICULUM['parts']:
    principles_count = len(part.get('principles', []))
    patterns_count = len(part.get('patterns', []))
    print(f"  Part {part['order']}: {principles_count} principles, {patterns_count} patterns")
