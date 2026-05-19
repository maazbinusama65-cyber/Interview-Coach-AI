"""
Centralised topic catalog — single source of truth for both
the /api/topics endpoint and request validation.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class TopicCategory:
    category: str
    topics: tuple[str, ...]


TOPIC_CATALOG: tuple[TopicCategory, ...] = (
    TopicCategory(
        category="Roles",
        topics=(
            "ML Engineer",
            "Backend Developer",
            "Frontend Developer",
            "Full-Stack Developer",
            "Data Scientist",
            "Data Engineer",
            "DevOps Engineer",
            "SRE / Platform Engineer",
            "Mobile Developer",
            "Product Manager",
            "Engineering Manager",
        ),
    ),
    TopicCategory(
        category="Languages",
        topics=(
            "Python",
            "JavaScript",
            "TypeScript",
            "Java",
            "Go",
            "Rust",
            "C++",
            "C#",
            "Ruby",
            "Kotlin",
            "Swift",
            "PHP",
            "SQL",
        ),
    ),
    TopicCategory(
        category="Frontend",
        topics=(
            "React",
            "Angular",
            "Vue",
            "Next.js",
            "Svelte",
            "HTML / CSS",
            "Tailwind CSS",
            "Web Performance",
            "Accessibility",
        ),
    ),
    TopicCategory(
        category="Backend",
        topics=(
            "Node.js",
            "Django",
            "FastAPI",
            "Spring Boot",
            "Express",
            "Flask",
            "Ruby on Rails",
            "GraphQL",
            "REST API Design",
            "gRPC",
        ),
    ),
    TopicCategory(
        category="Data & Storage",
        topics=(
            "PostgreSQL",
            "MongoDB",
            "Redis",
            "Elasticsearch",
            "Apache Kafka",
            "Data Modelling",
            "ETL Pipelines",
        ),
    ),
    TopicCategory(
        category="Infrastructure",
        topics=(
            "Docker",
            "Kubernetes",
            "AWS",
            "GCP",
            "Azure",
            "Terraform",
            "CI / CD",
            "Linux / Networking",
            "Observability",
        ),
    ),
    TopicCategory(
        category="CS Fundamentals",
        topics=(
            "Data Structures & Algorithms",
            "System Design",
            "Object-Oriented Design",
            "Design Patterns",
            "Operating Systems",
            "Distributed Systems",
            "Concurrency",
            "Security Fundamentals",
        ),
    ),
    TopicCategory(
        category="Soft Skills",
        topics=(
            "Behavioral / STAR",
            "Leadership",
            "Communication",
            "Conflict Resolution",
            "Project Management",
            "Teamwork & Collaboration",
            "Time Management",
        ),
    ),
)

# Flat set for fast membership testing
VALID_TOPICS: frozenset[str] = frozenset(
    topic for cat in TOPIC_CATALOG for topic in cat.topics
)

# Reverse map: topic → category
TOPIC_TO_CATEGORY: dict[str, str] = {
    topic: cat.category for cat in TOPIC_CATALOG for topic in cat.topics
}
