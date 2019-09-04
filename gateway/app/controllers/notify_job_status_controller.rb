# frozen_string_literal: true

class NotifyJobStatusController < ApplicationController
  def create
    job = params[:notify_job_status]

    ActionCable.server.broadcast(
        "job_state_notification_channel_#{job[:userId]}",
        job: job,
        time_stamp: Time.now.to_s
    )

    if job[:userId] != "rabbit-admin"
      ActionCable.server.broadcast(
          "job_state_notification_channel_rabbit-admin",
          job: job,
          time_stamp: Time.now.to_s
      )
    end

    :ok
  end
end
