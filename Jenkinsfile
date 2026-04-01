pipeline {
    agent any

    parameters {
        choice(
            name: 'HEALTH_MODE',
            choices: ['success', 'fail'],
            description: 'Simular estado del health check'
        )
    }

    environment {
        VERSION = ""
    }

    stages {

        stage('Generate Version') {
            steps {
                script {
                    VERSION = sh(
                        script: "date +%Y.%m.%d.%H%M",
                        returnStdout: true
                    ).trim()
                    env.APP_VERSION = VERSION
                }
            }
        }

        stage('Build') {
            steps {
                sh "docker compose build"
            }
        }

        stage('Deploy Blue/Green') {
            steps {
                script {

                    def active = sh(
                        script: "grep server nginx.conf | grep -v '#' | awk '{print \$2}' | cut -d: -f1",
                        returnStdout: true
                    ).trim()

                    def target = (active == "blue") ? "green" : "blue"

                    echo "Active: ${active}"
                    echo "Deploying to: ${target}"
                    echo "Health mode: ${params.HEALTH_MODE}"

                    sh """
                    export APP_VERSION=${VERSION}
                    export HEALTH_MODE=${params.HEALTH_MODE}

                    docker compose up -d --build ${target}
                    """

                    // pequeño tiempo inicial
                    sleep 5
                }
            }
        }

        stage('Health Check PRO') {
            steps {
                script {

                    def active = sh(
                        script: "grep server nginx.conf | grep -v '#' | awk '{print \$2}' | cut -d: -f1",
                        returnStdout: true
                    ).trim()

                    def target = (active == "blue") ? "green" : "blue"

                    echo "Running health check on ${target}"

                    try {
                        retry(5) {
                            sleep 3
                            sh "docker compose exec ${target} curl -f localhost:3000/health"
                        }
                    } catch (Exception e) {
                        error("Health check failed - aborting release")
                    }
                }
            }
        }

        stage('Switch Traffic') {
            steps {
                script {

                    def active = sh(
                        script: "grep server nginx.conf | grep -v '#' | awk '{print \$2}' | cut -d: -f1",
                        returnStdout: true
                    ).trim()

                    def target = (active == "blue") ? "green" : "blue"

                    echo "Switching traffic from ${active} to ${target}"

                    sh """
                    sed -i 's/server ${active}:3000;/# server ${active}:3000;/' nginx.conf
                    sed -i 's/# server ${target}:3000;/server ${target}:3000;/' nginx.conf

                    docker compose exec nginx nginx -s reload
                    """
                }
            }
        }

        stage('Tag Release') {
            steps {
                sh """
                git config user.email "jenkins@local"
                git config user.name "jenkins"

                git tag v${VERSION}
                git push origin v${VERSION}
                """
            }
        }
    }
}