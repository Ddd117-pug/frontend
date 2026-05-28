import request from "./request";

export function createConsultation(data) {
  return request({
    url: "/consultations",
    method: "post",
    data
  });
}

export function myConsultationPage(params) {
  return request({
    url: "/consultations/my",
    method: "get",
    params
  });
}

export function consultationDetail(consultationId) {
  return request({
    url: `/consultations/${consultationId}`,
    method: "get"
  });
}

export function sendConsultationMessage(consultationId, data) {
  return request({
    url: `/consultations/${consultationId}/messages`,
    method: "post",
    data
  });
}

export function closeConsultation(consultationId) {
  return request({
    url: `/consultations/${consultationId}/close`,
    method: "post"
  });
}

export function adminConsultationPage(params) {
  return request({
    url: "/admin/consultations",
    method: "get",
    params
  });
}

export function adminConsultationDetail(consultationId) {
  return request({
    url: `/admin/consultations/${consultationId}`,
    method: "get"
  });
}

export function adminReplyConsultation(consultationId, data) {
  return request({
    url: `/admin/consultations/${consultationId}/reply`,
    method: "post",
    data
  });
}

export function adminCloseConsultation(consultationId) {
  return request({
    url: `/admin/consultations/${consultationId}/close`,
    method: "post"
  });
}

export function adminMarkConsultationRead(consultationId) {
  return request({
    url: `/admin/consultations/${consultationId}/read`,
    method: "post"
  });
}
