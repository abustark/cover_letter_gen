use fetch_url::{safe_fetch_job_posting, FetchJobRequest};
use std::env;

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();

    let target_url = if args.len() > 1 {
        args[1].clone()
    } else {
        // Fallback for demonstration / serverless payload simulation
        match serde_json::from_reader::<_, FetchJobRequest>(std::io::stdin()) {
            Ok(req) => req.url,
            Err(_) => {
                eprintln!("Usage: fetch_url <target_https_url>");
                std::process::exit(1);
            }
        }
    };

    match safe_fetch_job_posting(&target_url).await {
        Ok(res) => {
            println!("{}", serde_json::to_string_pretty(&res).unwrap());
        }
        Err(err) => {
            eprintln!("SSRF Protection Blocked Request: {}", err);
            std::process::exit(1);
        }
    }
}
