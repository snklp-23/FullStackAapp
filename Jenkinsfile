pipeline {

    agent { label 'agent1' }

    environment {
        DOCKERHUB_USER   = "snklp"
        BACKEND_IMAGE    = "${DOCKERHUB_USER}/backend"
        FRONTEND_IMAGE   = "${DOCKERHUB_USER}/frontend"
        ECS_CLUSTER      = "MyAppCluster"
        BACKEND_SERVICE  = "fullstack-BackendService-03nF23yzmzmk"
        FRONTEND_SERVICE = "fullstack-FrontendService-2qfaSnZeF57T"
        AWS_REGION       = "ap-south-2"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/snklp-23/FullStackAapp.git'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                cd backend
                docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} .
                docker tag ${BACKEND_IMAGE}:${BUILD_NUMBER} ${BACKEND_IMAGE}:latest
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                cd frontend
                docker build -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} .
                docker tag ${FRONTEND_IMAGE}:${BUILD_NUMBER} ${FRONTEND_IMAGE}:latest
                '''
            }
        }

        stage('Push Images to Dockerhub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                    docker push ${BACKEND_IMAGE}:latest
                    docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                    docker push ${FRONTEND_IMAGE}:latest
                    '''
                }
            }
        }

        stage('Deploy Backend to ECS') {
            steps {
                sh '''
                aws ecs update-service \
                    --cluster ${ECS_CLUSTER} \
                    --service ${BACKEND_SERVICE} \
                    --force-new-deployment \
                    --region ${AWS_REGION}
                '''
            }
        }

        stage('Deploy Frontend to ECS') {
            steps {
                sh '''
                aws ecs update-service \
                    --cluster ${ECS_CLUSTER} \
                    --service ${FRONTEND_SERVICE} \
                    --force-new-deployment \
                    --region ${AWS_REGION}
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                aws ecs wait services-stable \
                    --cluster ${ECS_CLUSTER} \
                    --services ${BACKEND_SERVICE} ${FRONTEND_SERVICE} \
                    --region ${AWS_REGION}
                echo "Deployment Done!"
                '''
            }
        }
    }

    post {
        success {
            echo "App deployed successfully!"
        }
        failure {
            echo "Deployment failed! Check logs."
        }
    }
}
